# ts-quick-docs ![NPM](https://img.shields.io/npm/v/ts-quick-docs.svg) ![Circle CI](https://img.shields.io/circleci/project/giladgray/ts-quick-docs.svg)

> quick TypeScript documentation extractor

This little tool parses a TypeScript project and spits out a big list of documentation objects for each `interface` and `const` discovered. That data file can be used to generate human-friendly documentation in any desired format.

## Usage

#### CLI

1. `ts-quick-docs [path/to/file.ts]... > interfaces.json`
1. open `interfaces.json`

_Note: options are not supported from the CLI._

#### Node API

##### From TypeScript program:

```js
const ts = require("typescript");
const program = ts.createProgram(files, compilerOptions);

const tsdoc = require("ts-quick-docs");
const documentation = tsdoc(program, { /* options */ });
// documentation is an array of IDocEntry items
fs.writeFileSync("interfaces.json", JSON.stringify(documentation, null, 4));
```

##### From set of files:

```js
const tsdoc = require("ts-quick-docs");
const documentation = tsdoc.fromFiles(files, compilerOptions, { /* options */ });
// documentation is an array of IDocEntry items
fs.writeFileSync("interfaces.json", JSON.stringify(documentation, null, 4));
```

_Note that `files` must be an array but it can contain just the entry file if it imports others. A dummy TS program is created internally so we'll walk that tree for you._

## Options

#### excludeNames: `(string | RegExp)[]`

Array of patterns that will be matched against each entity's `name`. Matching entities will be excluded from the output.

#### excludePaths: `(string | RegExp)[]`

Array of patterns that will be matched against each file's path. Matching files _will be_ parsed but entities in those files _will not_ appear in the output.

#### ignoreDefinitions: `boolean = false`

Whether to exclude `.d.ts` files from the generated documentation blob.
Useful to ignore imported environment libraries, like `node.d.ts`.

#### includeBasicTypeProperties: `boolean = false`

Whether built-in properties for basic types should appear in the output (such as `String.prototype.toString`). Basic types include boolean, number, string, and arrays of those three. Defaults to `false` because these properties tend to pollute output for no benefit.
