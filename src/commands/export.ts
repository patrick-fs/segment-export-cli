import * as fs from 'fs'
import {DateTime, Interval, Duration} from 'luxon'
import * as mkdirp from 'mkdirp'
import {Command, flags} from '@oclif/command'
import * as ora from 'ora'
import * as zlib from 'zlib'
import * as fsApi from '../api'

const BATCH_SIZE = 2
const DATA_DIRECTORY = './data'

export default class GetSegment extends Command {
  static args = [
    {
      name: 'id',
      required: true,
      description: 'segment id of the segment you created in FullStory',
    },
  ];

  static flags = {
    help: flags.help({char: 'h'}),
    start: flags.string({char: 's', description: 'start of query: mm/dd/yyyy', required: true}),
    end: flags.string({char: 'e', description: 'end of query: mm/dd/yyyy'}),
    format: flags.string({char: 'f', options: ['JSON', 'CSV'], default: 'FORMAT_CSV', parse: i => {
      if (i === 'JSON') return fsApi.ExportFormats.json
      return fsApi.ExportFormats.csv
    }}),
    type: flags.string({char: 't', options: ['event', 'individual'], default: fsApi.ExportTypes.event, parse: i => {
      if (i === 'event') return fsApi.ExportTypes.event
      return fsApi.ExportTypes.individual
    }}),
    directory: flags.string({char: 'd', description: 'location of the output directory', default: DATA_DIRECTORY}),
  };

  async run() {
    const {args, flags} = this.parse(GetSegment)
    // TODO: validate flags and args formats
    // or choose a default start...

    const intervals = this.getIntervals(flags.start, flags.end)
    let downloads: Promise<any>[] = []

    const spinner = ora('Getting export').start()
    spinner.color = 'yellow'

    const exportOptions = {
      segment_id: args.id,
      type: flags.type,
      format: flags.format,
    }

    for (let i = 0; i < intervals.length; i++) {
      try {
        downloads.push(this.downloadFile(intervals[i], exportOptions, flags.directory))
        if (i > 0 && i % BATCH_SIZE === 0) {
          await Promise.all(downloads) // eslint-disable-line no-await-in-loop
          spinner.text = `downloaded: ${i}/${intervals.length}`
          downloads = []
        }
      } catch (error) {
        console.error(`failed to download files: ${error}`)
        downloads = []
      }
    }

    spinner.stopAndPersist({
      text: '✅ Segment export complete!',
    })
  }

  getIntervals(startDate: string, endDate?: string, intervalDuration = '15') {
    const segmentDuration = Duration.fromISO(`PT${intervalDuration}M`)
    const start = DateTime.fromFormat(startDate, 'D')
    let end: DateTime
    if (endDate && endDate !== '') {
      end = DateTime.fromFormat(endDate, 'D')
    } else {
      const {day, month, year} = DateTime.fromMillis(Date.now()).toObject()
      end = DateTime.fromObject({day, month, year})
    }
    const interval = Interval.fromDateTimes(start, end)
    return interval.splitBy(segmentDuration)
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
