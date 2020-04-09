segex
=====

Provide a FullStory segment id and time range to download data for that segment.

`segex` is not currently distrbuted on NPM, so you'll have to pull down this code and execute it locally with `./bin/run`.

# Install

Clone this repo and

```
npm install
```

Copy and paste `.conig/fullstory-example.json`, rename it `.conig/fullstory.json`, and add your FullStory API key.

```JSON
{
  "API_KEY": "your key here"
}
```

# Finding a Segment Id in FullStory

Segments are created by saving FullStory searches. More information can be found on FullStory's [help site](https://help.fullstory.com/hc/en-us/articles/360020622754-Can-I-save-searches-that-I-use-frequently-create-a-segment-)

<img src="https://user-images.githubusercontent.com/45576380/78920688-c7292400-7a61-11ea-850d-be7d9c8a648a.png" width="250px" />

Once you've created a segment in FullStory, you can find the ID in the URL when you're viewing the segment.

## Example segment IDs

### Custom segment

The ID in this example is "patric<span>k@f</span>ullstory.com:4241245858598272"

htt<span>ps</span>://app.staging.fullstory.com/ui/thefullstory.com/segments/**patric<span>k@f</span>ullstory.com:4241245858598272**/people/0

### Standard segment

The ID in this example is "rageClicks"

htt<span>ps</span>://app.staging.fullstory.com/ui/thefullstory.com/segments/**rageClicks**/people/0

# Usage

```
./bin/run export
```

## Command arguments and flags

```sh-session
$ ./bin/run --help export
USAGE
  $ segex export [ID]

ARGUMENTS
  ID  [default: everyone] segment id of the segment to be downloaded from FullStory

OPTIONS
  -d, --directory=directory     [default: ./data] location of the output directory
  -e, --end=end                 end of query: mm/dd/yyyy, defaults to yesterday (the most recent day that data is available)
  -f, --format=JSON|CSV         [default: FORMAT_CSV]
  -h, --help                    show CLI help
  -i, --interval=5|10|15|30|60  [default: 15] time increments for each downloaded file
  -s, --start=start             start of query: mm/dd/yyyy, defaults to 30 days in the past
  -t, --type=event|individual   [default: TYPE_EVENT]
```

## Data directory structure

The CLI creates files in the `data` directory at the root of this project by default. The directory structure is:

```
data
├── {segment id}
│   └── {segment type}
│       └── {date}
│           ├── {segment export file CSV|JSON}
```

### Output examples

In this example, you see the result of running two commands:

`./bin/run export adam@fullstory.com:4721245852598272 -s 4/6/2020 -e 4/8/2020` outputs to `data/adam@fullstory.com:4721245852598272`

`./bin/run export` outputs to `data/everyone`

<img src="https://user-images.githubusercontent.com/45576380/78919346-cbecd880-7a5f-11ea-867a-060a0db587da.png" width="550px" />
