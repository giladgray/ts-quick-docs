# ts-quick-docs

> quick TypeScript documentation extractor

This little tool parses a TypeScript project and spits out a big list of documentation objects for each `interface` and `const` discovered. That data file can be used to generate human-friendly documentation in any desired format.

## Installation

1. Install Node + npm
1. Install [typings]()
1. `npm install && typings install`

## Usage

**CLI**

1. `ts-quick-docs [path/to/file.ts]... > interfaces.json`
1. open `interfaces.json`

**Node API**

```js
const ts = require("typescript");
const program = ts.createProject(files, compilerOptions);

const tsdoc = require("ts-quick-docs");
const documentation = tsdoc(program, { /* options */ });
// documentation is an array of IDocEntry items
fs.writeFileSync("interfaces.json", JSON.stringify(documentation, null, 4));
```

## Options

#### excludeNames: `(string | RegExp)[]`

Array of patterns that will be matched against each entity's `name`. Matching entities will be excluded from the output.

#### excludePaths: `(string | RegExp)[]`

Array of patterns that will be matched against each file's path. Matching files will not be parsed and entities in those files will not appear in the output.

#### ignoreDefinitions: `boolean = false`

Whether to exclude `.d.ts` files from the generated documentation blob.
Useful to ignore imported environment libraries, like `node.d.ts`.
