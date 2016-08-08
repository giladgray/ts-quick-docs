import * as ts from "typescript";
import Documentation from "./src/documentation";

// if run from the command line...
if (!module.parent) {
    const program = ts.createProgram(process.argv.slice(2), {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.None,
        noLib: true,
        target: ts.ScriptTarget.ES6,
    });
    const output = Documentation.fromProgram(program);
    /* tslint:disable-next-line:no-console */
    console.log(JSON.stringify(output, null, 2));
}

module.exports = Documentation.fromProgram;
module.exports.fromFiles = Documentation.fromFiles;
