segex
=====

FullStory segment export CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/segex.svg)](https://npmjs.org/package/segex)
[![Downloads/week](https://img.shields.io/npm/dw/segex.svg)](https://npmjs.org/package/segex)
[![License](https://img.shields.io/npm/l/segex.svg)](https://github.com/patrick-fs/segex/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g segex
$ segex COMMAND
running command...
$ segex (-v|--version|version)
segex/0.1.0 darwin-x64 node-v10.16.0
$ segex --help [COMMAND]
USAGE
  $ segex COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`segex hello [FILE]`](#segex-hello-file)
* [`segex help [COMMAND]`](#segex-help-command)

## `segex hello [FILE]`

describe the command here

```
USAGE
  $ segex hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ segex hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/patrick-fs/segex/blob/v0.1.0/src/commands/hello.ts)_

## `segex help [COMMAND]`

display help for segex

```
USAGE
  $ segex help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_
<!-- commandsstop -->
