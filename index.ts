import * as ts from "typescript";
import * as fs from "fs";
import Documentation, { IDocumentationOptions } from "./src/documentation";

/** Generate documention for all classes in a set of .ts files */
function generateDocumentation(program: ts.Program, options?: IDocumentationOptions) {
    let documention = new Documentation(program, options);
    return documention.extract();
}

// if run from the command line...
if (!module.parent) {
    const program = ts.createProgram(process.argv.slice(2), {
        jsx: ts.JsxEmit.React,
        module: ts.ModuleKind.None,
        noLib: true,
        target: ts.ScriptTarget.ES6,
    });
    const output = generateDocumentation(program);
    fs.writeFileSync("classes.json", JSON.stringify(output, null, 4));
}

module.exports = generateDocumentation;
