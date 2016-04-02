# tsdoc

> Typescript Documentation Parser

## Installation

1. Install Node + npm
1. Install [typings]()
1. `npm install && typings install`

## Usage

**CLI**
1. `node ./tsdoc <path/to/file.ts>`
1. open `classes.json`

**Node API**

```js
const ts = require("ts");
const program = ts.createProject(files, options);

const tsdoc = require("tsdoc");
const documentation = tsdoc(program);
fs.writeFileSync("classes.json", JSON.stringify(documentation, null, 4));
```

## TODO

- API design
- testing
- options
- how should it be used?
