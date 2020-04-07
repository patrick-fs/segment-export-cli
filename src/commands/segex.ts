import { Command, flags } from '@oclif/command';

export default class GetSegment extends Command {

  static args = [
    { name: 'id' },
  ];

  static flags = {
    help: flags.help({char: 'h'}),    
    start: flags.string({char: 's', description: 'start of query: mm/dd/yyyy' }),
    end: flags.string({char: 'e', description: 'end of query: mm/dd/yyyy' }),
    format: flags.string({ char: 'f', options: ['JSON', 'CSV'], default: 'FORMAT_CSV', parse: i => {
      if (i === 'JSON') return 'FORMAT_NDJSON';
      return 'FORMAT_CSV';
    }}),
    type: flags.string({ char: 't', options: ['event', 'individual'], default: 'TYPE_EVENT', parse: i => {
      if (i === 'event') return 'TYPE_EVENT';
      return 'TYPE_INDIVIDUAL';
    }}),
    directory: flags.string({char: 'd', description: 'location of output directory', default: './data' }),
  };

  async run() {
  }
}