segex
=====

FullStory segment export CLI

`segex` is not currently distrbuted on NPM, so you'll have to pull down this code and execute it locally with `./bin/run`.

# Install

Clone this repo and

```
npm install
```

# Usage

The `ID` argument adn the `start` flag are required.
```
./bin/run export {ID} -s {start date as mm/dd/yyyy}
```

```sh-session
$ ./bin/run export patrick@fullstory.com:4241245858598272 -s 4/6/2020
⠏ Getting export
$ ./bin/run (-v|--version|version)
segex/0.1.0 darwin-x64 node-v10.16.0
$ ./bin/run --help export
USAGE
  $ segex export ID

ARGUMENTS
  ID  segment id of the segment you created in FullStory

OPTIONS
  -d, --directory=directory    [default: ./data] location of the output directory
  -e, --end=end                end of query: mm/dd/yyyy
  -f, --format=JSON|CSV        [default: FORMAT_CSV]
  -h, --help                   show CLI help
  -s, --start=start            (required) start of query: mm/dd/yyyy
  -t, --type=event|individual  [default: TYPE_EVENT]
```
