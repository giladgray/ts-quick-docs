import * as ts from "typescript";
import * as path from "path";
import { resolveFlags } from "./flags";
import { IDocEntry, IInterfaceEntry, IPropertyEntry } from "./interfaces";

export interface IDocumentationOptions {
    /** Array of patterns to match against each `name` and omit items that match. */
    excludeNames?: (string | RegExp)[];

    /** Array of patterns to match against each file path and omit items that match. */
    excludePaths?: (string | RegExp)[];

    /** Whether `.d.ts` files should always be ignored. */
    ignoreDefinitions?: boolean;
}

export default class Documentation {
    private program: ts.Program;
    private options: IDocumentationOptions;

    private get checker() { return this.program.getTypeChecker(); }

    public static fromProgram(program: ts.Program, options?: IDocumentationOptions) {
        return new Documentation(program, options).extract();
    }

    public static fromFiles(files: string[], compilerOptions?: ts.CompilerOptions, options?: IDocumentationOptions) {
        return Documentation.fromProgram(ts.createProgram(files, compilerOptions), options);
    }

    constructor(program: ts.Program, options: IDocumentationOptions = {}) {
        this.program = program;
        this.options = options;
    }

    public extract(): IInterfaceEntry[] {
        const output: IInterfaceEntry[] = [];

        const visit = (node: ts.Node) => {
            if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
                // This is a top level interface, get its symbol
                let symbol = this.checker.getSymbolAtLocation((<ts.InterfaceDeclaration>node).name);
                output.push(this.serializeInterface(symbol, this.getFileName(node)));
            } else if (node.kind === ts.SyntaxKind.VariableStatement) {
                let list = (<ts.VariableStatement>node).declarationList.declarations.map((decl) => {
                    const symbol = this.checker.getSymbolAtLocation(decl.name);
                    return this.serializeVariable(symbol, this.getFileName(node));
                });
                output.push(...list);
            } else if (node.kind === ts.SyntaxKind.ModuleDeclaration || node.kind === ts.SyntaxKind.VariableStatement) {
                // This is a namespace, visit its children
                ts.forEachChild(node, visit);
            }
        };

        // Visit every sourceFile in the program
        for (const sourceFile of this.program.getSourceFiles()) {
            if (this.shouldSkipFile(sourceFile.fileName)) { continue; }
            // Walk the tree to search for classes
            ts.forEachChild(sourceFile, visit);
        }
        return output.filter(this.filterEntryName);
    }

    private getFileName(node: ts.Node) {
        return path.relative(process.cwd(), node.getSourceFile().fileName);
    }

    private getTypeOfSymbol(symbol: ts.Symbol) {
        return this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    }

    private serializeSymbol(symbol: ts.Symbol): IDocEntry {
        return {
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            name: symbol.getName(),
            type: this.checker.typeToString(this.getTypeOfSymbol(symbol)),
        };
    }

    private serializeInterface(symbol: ts.Symbol, fileName: string) {
        let details: IInterfaceEntry = {
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            fileName,
            name: symbol.getName(),
            type: "interface",
        };

        const interfaceNode = symbol.declarations[0] as ts.InterfaceDeclaration;
        if (interfaceNode.heritageClauses != null) {
            details.extends = interfaceNode.heritageClauses[0].types.map((type) => type.getText());
        }

        // Get the props signatures
        // symbols without a `valueDeclaration` will crash things on TS 2.0, so filter these out
        details.properties = Object.keys(symbol.members).sort().map((name) => symbol.members[name])
            .filter((sym) => sym.valueDeclaration != null)
            .map(this.serializeDeclaration)
            .filter(this.filterEntryName);
        return details;
    }

    private serializeVariable(symbol: ts.Symbol, fileName: string) {
        let details: IInterfaceEntry = this.serializeSymbol(symbol);
        details.fileName = fileName;
        details.properties = this.getTypeOfSymbol(symbol).getProperties().map((s) => this.serializeSymbol(s));
        return details;
    }

    private serializeDeclaration = (symbol: ts.Symbol) => {
        let details: IPropertyEntry = this.serializeSymbol(symbol);
        details.optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
        return resolveFlags(details);
    }

    private filterEntryName = (entry: IInterfaceEntry) => {
        const { excludeNames = [] } = this.options;
        return excludeNames.every((pattern) => entry.name.match(pattern as string) == null);
    }

    private shouldSkipFile(fileName: string) {
        const { excludePaths, ignoreDefinitions } = this.options;
        return (ignoreDefinitions && /\.d\.ts$/.test(fileName))
            || (excludePaths != null && excludePaths.some((pattern) => fileName.match(pattern as string) != null));
    }
}
