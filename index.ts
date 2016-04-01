import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

interface DocEntry {
    constructors?: DocEntry[],
    default?: string;
    deprecated?: boolean;
    documentation?: string,
    fileName?: string,
    internal?: boolean;
    name?: string,
    optional?: boolean;
    parameters?: DocEntry[],
    returnType?: string
    type?: string,
};

/** Generate documention for all classes in a set of .ts files */
function generateDocumentation(program: ts.Program): DocEntry[] {
    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let output: DocEntry[] = [];

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
        if (/\.d\.ts$/.test(sourceFile.fileName)) {
            continue;
        }
        // Walk the tree to search for classes
        ts.forEachChild(sourceFile, visit);
    }

    return output;

    /** visit nodes finding exported classes */
    function visit(node: ts.Node) {
        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            // This is a top level class, get its symbol
            let symbol = checker.getSymbolAtLocation((<ts.ClassDeclaration>node).name);
            output.push(serializeClass(symbol));
        } else if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
            // This is a top level interface, get its symbol
            let symbol = checker.getSymbolAtLocation((<ts.InterfaceDeclaration>node).name);
            output.push(serializeInterface(symbol, node.getSourceFile().fileName));
        } else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }

    /** Serialize a symbol into a json object */
    function serializeSymbol(symbol: ts.Symbol): DocEntry {
        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
        };
    }

    /** Serialize a class symbol infomration */
    function serializeClass(symbol: ts.Symbol) {
        let details = serializeSymbol(symbol);

        // Get the construct signatures
        let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        details.constructors = constructorType.getConstructSignatures().map(serializeSignature);
        return details;
    }

    function serializeInterface(symbol: ts.Symbol, fileName: string) {
        let details = serializeSymbol(symbol);
        details.type = "interface";
        details.fileName = fileName;

        // Get the props signatures
        details.parameters = Object.keys(symbol.members).sort().map((name) => serializeDeclaration(symbol.members[name]));
        return details;
    }

    function serializeDeclaration(symbol: ts.Symbol) {
        let details = serializeSymbol(symbol);
        details.optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
        details.documentation = details.documentation.replace(/@([\w-]+)(?:\s(\S+))?/g, (m, flag, value) => {
            switch (flag) {
                case "default":
                    details.default = value;
                    break;
                case "deprecated":
                    details.deprecated = true;
                    break;
                case "internal":
                    details.internal = true;
                    break;
            }
            // remove flag from output
            return "";
        });
        return details;
    }

    /** Serialize a signature (call or construct) */
    function serializeSignature(signature: ts.Signature) {
        return {
            parameters: signature.parameters.map(serializeSymbol),
            returnType: checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment())
        };
    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }
}

// if run from the command line...
if (!module.parent) {
    const program = ts.createProgram(process.argv.slice(2), {
        target: ts.ScriptTarget.ES6,
        module: ts.ModuleKind.None,
        noLib: true,
        jsx: ts.JsxEmit.React,
    });
    const output = generateDocumentation(program);
    fs.writeFileSync("classes.json", JSON.stringify(output, null, 4));
}

module.exports = generateDocumentation;
