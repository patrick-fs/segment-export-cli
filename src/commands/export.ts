import * as fs from 'fs'
import {DateTime, Interval, Duration} from 'luxon'
import * as mkdirp from 'mkdirp'
import {Command, flags} from '@oclif/command'
import * as ora from 'ora'
import * as zlib from 'zlib'
import * as fsApi from '../api'

const DATA_DIRECTORY = './data'
const BATCH_SIZE = 3;

export default class GetSegment extends Command {
  static args = [
    {
      name: 'id',
      description: 'segment id of the segment to be downloaded from FullStory',
      default: 'everyone',
    },
  ];

  static flags = {
    help: flags.help({char: 'h'}),
    start: flags.string({char: 's', description: 'start of query: mm/dd/yyyy, defaults to 30 days in the past'}),
    end: flags.string({char: 'e', description: 'end of query: mm/dd/yyyy, defaults to yesterday (the most recent day that data is available)'}),
    format: flags.string({char: 'f', options: ['JSON', 'CSV'], default: 'FORMAT_CSV', parse: i => {
      if (i === 'JSON') return fsApi.ExportFormats.json
      return fsApi.ExportFormats.csv
    }}),
    type: flags.string({char: 't', options: ['event', 'individual'], default: fsApi.ExportTypes.event, parse: i => {
      if (i === 'event') return fsApi.ExportTypes.event
      return fsApi.ExportTypes.individual
    }}),
    directory: flags.string({char: 'd', description: 'location of the output directory', default: DATA_DIRECTORY}),
    interval: flags.string({char: 'i', options: ['5', '10', '15', '30', '60'], default: '15', description: 'time increments for each downloaded file'})
  };

  async run() {
    const {args, flags} = this.parse(GetSegment)
    // TODO: validate flags and args formats
    // or choose a default start...
    
    const start = this.getStartDate(flags.start);
    const end = this.getEndDate(flags.end);
    const intervals = this.getIntervals(start, end, flags.interval)

    console.log(`dowloading ${args.id}, starting from ${start}, ending ${end}`);

    const spinner = ora('Getting export').start()
    spinner.color = 'yellow'

    let finalDownload;

    for await (const download of this.fetch(intervals)) {
      if (download.snoozing) {
        if (download.error) {
          spinner.text = `an error occurred: ${download.error}, snoozing for ${download.snoozeLength/1000} seconds and trying again`
        } else {
          spinner.text = `hit API request quota, snoozing for ${download.snoozeLength/1000} seconds`;
        }
      } else {
        spinner.text = `downloaded: ${download.processedCount}/${intervals.length}\n`
      }
      finalDownload = download;
    }

    if (finalDownload?.error) {
      spinner.stopAndPersist({
        text: `error downloading files: ${finalDownload?.error}`,
      })
      console.log(finalDownload?.error);
    } else {
      spinner.stopAndPersist({
        text: '✅ Segment export complete!',
      })
    }
    
  }

  getStartDate(startDate?: string) {
    return this.getDate(30, startDate);
  }

  getEndDate(endDate?: string) {
      // NOTE: There is a 24-hour delay before events are available to segement export
      return this.getDate(1, endDate);
  }

  getDate(daysSince: number, date?: string) {
    let dateTime: DateTime
    if (date && date !== '') {
      dateTime = DateTime.fromFormat(date, 'D')
    } else {
      const {day, month, year} = DateTime.fromMillis(Date.now()).toObject()
      dateTime = DateTime.fromObject({day, month, year}).minus({ days: daysSince })
    }
    
    return`${dateTime.month}/${dateTime.day}/${dateTime.year}`;
  }

  getIntervals(startDate: string, endDate: string, intervalDuration = '15') {
    const segmentDuration = Duration.fromISO(`PT${intervalDuration}M`)
    const start = DateTime.fromFormat(startDate, 'D')
    const end = DateTime.fromFormat(endDate, 'D')
    
    const interval = Interval.fromDateTimes(start, end)
    return interval.splitBy(segmentDuration)
  }

  async *fetch(intervals: Interval[]) {
    const {args, flags} = this.parse(GetSegment)
    const exportOptions = {
      segment_id: args.id,
      type: flags.type,
      format: flags.format,
    }
    const sleepStart = 2000;

    const intervalsCopy = intervals.slice();
    let sleepTime = sleepStart;

    let processedCount = 0;
    let next = intervalsCopy.pop();

    let downloads: Promise<void>[] = []

    const pushDownloads = () => {
      downloads = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const next = intervalsCopy.pop();
        if (next) {
          downloads.push(this.downloadFile(next, exportOptions, flags.directory));
        }
      }
    }
    
    pushDownloads();
    while (downloads.length > 0 && sleepTime <= 128000) {
      try {
        await Promise.all(downloads)
        processedCount = processedCount + downloads.length
        yield {
          processedCount,
          snoozing: false,
          snoozeLength: 0
        }
        pushDownloads();
        sleepTime = sleepStart;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          yield {
            processedCount,
            snoozing: true,
            snoozeLength: sleepTime
          }
        } else {
          yield {
            processedCount,
            snoozing: true,
            snoozeLength: sleepTime,
            error
          }
        }
        await this.sleep(sleepTime);
        sleepTime = sleepTime * 2;
      }      
    }

    if (processedCount < intervals.length) {
      yield {
        processedCount,
        snoozing: false,
        snoozeLength: 0,
        error: new Error('did not complete all downloads')
      }
    }

  }

  sleep(milliseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

  async downloadFile<T extends Omit<fsApi.ExportOptions, 'time_range'>>(interval: Interval, exportOptions: T, directory = DATA_DIRECTORY) {
    const {day, month, year} = interval.start.toObject()
    const directoryName = `${directory}/${exportOptions.segment_id}/${this.getExportType(exportOptions.type)}/${year}-${month}-${day}`
    mkdirp(directoryName)

    const start = interval.start.toISO({includeOffset: false})
    const end = interval.end.toISO({includeOffset: false})

    const exportResp = await fsApi.startExport({
      ...exportOptions,
      time_range: {
        start: `${start}Z`,
        end: `${end}Z`,
      },
    }).catch(error => {
      console.error(`failed to start export: ${error}`)
      throw error
    })

    const opComplete = await this.pollUntilComplete(exportResp.operationId)
    .catch(error => {
      console.error(`failed to poll operations: ${error}`)
      throw error
    })
    const fileUrl = await fsApi.getExportFileURL(opComplete.searchExportId)
    .catch(error => {
      console.error(`failed to get export file url: ${error}`)
      throw error
    })
    const fileStream = await fsApi.getExportFileStream(fileUrl)
    .catch(error => {
      console.error(`failed to get export file stream: ${error}`)
      throw error
    })
    const writeStream = fs.createWriteStream(
      `${directoryName}/${start}.${this.getFileExtension(exportOptions.format)}`,
      {encoding: 'utf-8'})

    const unzip = zlib.createGunzip()
    fileStream.data.pipe(unzip).pipe(writeStream)
  }

  getFileExtension(format: string) {
    if (format === fsApi.ExportFormats.json) return 'json'
    return 'csv'
  }

  getExportType(exportOptionType: string) {
    if (exportOptionType === fsApi.ExportTypes.event) return 'event'
    return 'individual'
  }

  pollUntilComplete(operationId: string): Promise<{searchExportId: string; expires: string}> {
    return new Promise((resolve, reject) => {
      let operationsResp: fsApi.OperationResponse
      const id = setInterval(async () => {
        try {
          operationsResp = await fsApi.getOperation(operationId)
        } catch (error) {
          return reject(new Error(`failed to get operation: ${error}`))
        }
        if (operationsResp.state === 'COMPLETED') {
          clearInterval(id)
          resolve({
            searchExportId: operationsResp.results.searchExportId,
            expires: operationsResp.results.expires,
          })
        }
      }, 2000)
    })
  }
}
