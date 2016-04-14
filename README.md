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
const program = ts.createProject(files, options);

const tsdoc = require("ts-quick-docs");
const documentation = tsdoc(program, { /* options */ });
fs.writeFileSync("interfaces.json", JSON.stringify(documentation, null, 4));
```

## Options

#### ignoreDefinitions: boolean

Whether to exclude `.d.ts` files from the generated documentation blob.
Useful to ignore imported environment libraries, like `node.d.ts`.
