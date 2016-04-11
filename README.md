# tsdoc

> Typescript Documentation Parser

This little tool parses a TypeScript project and spits out a big list of documentation objects for each `interface` and `const` discovered. That data file can be used to generate human-friendly documentation in any desired format.

## Installation

1. Install Node + npm
1. Install [typings]()
1. `npm install && typings install`

## Usage

**CLI**

1. `node ./tsdoc [path/to/file.ts]... > [output filename]`
1. open `classes.json`

**Node API**

```js
const ts = require("ts");
const program = ts.createProject(files, options);

const tsdoc = require("tsdoc");
const documentation = tsdoc(program, { /* options */ });
fs.writeFileSync("classes.json", JSON.stringify(documentation, null, 4));
```

## Options

#### ignoreDefinitions: boolean

Whether to exclude `.d.ts` files from the generated documentation blob.
Useful to ignore imported environment libraries, like `node.d.ts`.

## TODO

- API design
- more options
- simpler usage
