segex
=====

`segex` is a command line interface that lets you download FullStory "event" and "individual" data for specific segments via FullStory's [Segment Export API](https://developer.fullstory.com/create-segment-export)

`segex` is not currently distributed on NPM, so you'll have to pull down this code and execute it locally with `./bin/run`. You'll need to have [node JS](https://nodejs.org/en/) installed on your machine to run `segex`.

# Install

- Clone this repo and `npm install` in the root directory (the same directory that contains `package.json`)
- Copy and paste `.config/fullstory-example.json`, rename it `.config/fullstory.json`, and add your FullStory [API key](https://help.fullstory.com/hc/en-us/articles/360020624834).

```JSON
{
  "API_KEY": "your key here",
  "API_DOMAIN" : "https://api.fullstory.com"
}
```

# Finding a Segment Id in FullStory

Segments are created by saving FullStory searches. More information can be found on FullStory's [help site](https://help.fullstory.com/hc/en-us/articles/360020622754-Can-I-save-searches-that-I-use-frequently-create-a-segment-).

<img src="https://user-images.githubusercontent.com/45576380/78920688-c7292400-7a61-11ea-850d-be7d9c8a648a.png" width="250px" />

Once you've created a segment in FullStory, you can find the segment ID in the URL when you're viewing the segment.

<img src="https://user-images.githubusercontent.com/45576380/78924906-8ed91400-7a68-11ea-80ff-e9f5525cee82.png" width="860px" />

## Example segment IDs

### Custom segment

The ID in this example is "patric<span>k@f</span>ullstory.com:4241245858598272"

htt<span>ps</span>://app.staging.fullstory.com/ui/thefullstory.com/segments/**patric<span>k@f</span>ullstory.com:4241245858598272**/people/0

### Standard segment

The ID in this example is "rageClicks"

htt<span>ps</span>://app.staging.fullstory.com/ui/thefullstory.com/segments/**rageClicks**/people/0

# Usage

```
$ ./bin/run export
```

## Command arguments and flags

```sh-session
$ ./bin/run --help export
USAGE
  $ segex export [ID]

ARGUMENTS
  ID  [default: everyone] segment id of the segment to be downloaded from FullStory

OPTIONS
  -d, --directory=directory                      [default: ./data] location of the output directory
  -e, --end=end                                  end of query: mm/dd/yyyy, defaults to yesterday (the most recent day that data is available)
  -f, --format=JSON|CSV                          [default: FORMAT_CSV]
  -h, --help                                     show CLI help
  -i, --interval=5m|10m|15m|30m|1h|2h|3h|4h|24h  [default: 15m] time increments for each downloaded file

  -l, --fields=fields                            a comma-delimited list of fields to select - for example: EventStart,EventType. Find the Data Export data 
                                                 dictionary of all fields here: https://developer.fullstory.com/get-data-export

  -s, --start=start                              start of query: mm/dd/yyyy, defaults to 30 days in the past

  -t, --type=event|individual                    [default: TYPE_EVENT]
```

- `--type event` returns event records: each row is an individual event recorded by FullStory. You can find the data dictionary for
event records at https://developer.fullstory.com/get-data-export.
- `--type individual` returns individual records: each row represents an identified user with some aggregate metrics about their behavior on your site.
- `--interval` controls how large your file sizes are: the smaller the interval the smaller the file size, and the greater the number of files.

## Data directory structure

The CLI creates files in the `data` directory at the root of this project by default. The directory structure is:

```
data
├── {segment id}
│   └── {segment type event|individual}
│       └── {date}
│           ├── {segment export file csv|json}
```

### Output examples

`./bin/run export adam@fullstory.com:4721245852598272 -s 4/6/2020 -e 4/8/2020 -t event`

outputs to

`data/adam@fullstory.com:4721245852598272/event`

<hr />

`./bin/run export adam@fullstory.com:4721245852598272 -s 4/6/2020 -e 4/8/2020 -t individual`

outputs to

`data/adam@fullstory.com:4721245852598272/individual`

<hr />

`./bin/run export` outputs to `data/everyone/event`

<img src="https://user-images.githubusercontent.com/45576380/78919346-cbecd880-7a5f-11ea-867a-060a0db587da.png" width="550px" />
