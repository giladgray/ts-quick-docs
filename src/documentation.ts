import * as path from "path";
import * as ts from "typescript";
import { IDocEntry, IInterfaceEntry, IJsDocTags, IPropertyEntry } from "./interfaces";

export interface IDocumentationOptions {
    /** Array of patterns to match against each `name` and omit items that match. */
    excludeNames?: Array<string | RegExp>;

    /** Array of patterns to match against each file path and omit items that match. */
    excludePaths?: Array<string | RegExp>;

    /**
     * Whether built-in properties for basic types should appear in the output (such as String.prototype.toString).
     * Defaults to `false` because these properties tend to pollute output for no benefit.
     * @default false
     */
    includeBasicTypeProperties?: boolean;

    /**
     * Whether symbols from `.d.ts` files should be included in the output.
     * Enabling this can get very messy as everything from `@types` will be included.
     * @default false
     */
    includeDefinitionFiles?: boolean;
}

export default class Documentation {
    public static fromProgram(program: ts.Program, options?: IDocumentationOptions) {
        return new Documentation(program, options).extract();
    }

    public static fromFiles(filePaths: string[], compilerOptions: ts.CompilerOptions, options?: IDocumentationOptions) {
        if (!Array.isArray(filePaths)) {
            throw new Error(`expected array of file paths, received ${typeof filePaths}`);
        }
        return Documentation.fromProgram(ts.createProgram(filePaths, compilerOptions), options);
    }

    private program: ts.Program;
    private options: IDocumentationOptions;

    private get checker() { return this.program.getTypeChecker(); }

    constructor(program: ts.Program, options: IDocumentationOptions = {}) {
        this.program = program;
        this.options = {
            includeBasicTypeProperties: false,
            includeDefinitionFiles: false,
            ...options,
        };
    }

    public extract(): IInterfaceEntry[] {
        const output: IInterfaceEntry[] = [];

        const visit = (node: ts.Node) => {
            if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
                // This is a top level interface, get its symbol
                const symbol = this.checker.getSymbolAtLocation((node as ts.InterfaceDeclaration).name);
                output.push(this.serializeInterface(symbol, this.getFileName(node)));
            } else if (node.kind === ts.SyntaxKind.VariableStatement) {
                const list = (node as ts.VariableStatement).declarationList.declarations.map((decl) => {
                    const symbol = this.checker.getSymbolAtLocation(decl.name);
                    return this.serializeVariable(symbol, this.getFileName(node));
                });
                output.push(...list);
            } else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
                // This is a namespace, visit its children
                ts.forEachChild(node, visit);
            }
        };

        // Visit every sourceFile in the program
        for (const sourceFile of this.program.getSourceFiles()) {
            if (!this.options.includeDefinitionFiles && /\.d\.ts$/.test(sourceFile.fileName)) { continue; }
            // Walk the tree to search for classes
            ts.forEachChild(sourceFile, visit);
        }
        return output.filter(this.filterEntry);
    }

    private getFileName(node: ts.Node) {
        return path.relative(process.cwd(), node.getSourceFile().fileName);
    }

    private getJsDocTags(symbol: ts.Symbol) {
        return symbol.getJsDocTags().reduce((tags, { name, text }) => {
            tags[name] = text.length > 0 ? text : true;
            return tags;
        }, {} as IJsDocTags);
    }

    private getTypeOfSymbol(symbol: ts.Symbol) {
        return this.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    }

    private getTypeString(symbol: ts.Symbol) {
        return this.checker.typeToString(this.getTypeOfSymbol(symbol), null,
            // this flag will include namespaces such as __React
            ts.TypeFormatFlags.UseFullyQualifiedType);
    }

    private serializeSymbol(symbol: ts.Symbol, fileName: string): IDocEntry {
        return {
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            fileName,
            name: symbol.getName(),
            tags: this.getJsDocTags(symbol),
            type: this.getTypeString(symbol),
        };
    }

    private serializeDeclaration = (symbol: ts.Symbol, fileName: string) => {
        const details: IPropertyEntry = this.serializeSymbol(symbol, fileName);
        // tslint:disable-next-line:no-bitwise
        details.optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
        return details;
    }

    private serializeInterface(symbol: ts.Symbol, fileName: string) {
        const details: IInterfaceEntry = {
            documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
            fileName,
            name: symbol.getName(),
            tags: this.getJsDocTags(symbol),
            type: "interface",
        };

        const interfaceNode = symbol.declarations[0] as ts.InterfaceDeclaration;
        if (interfaceNode.heritageClauses != null) {
            details.extends = interfaceNode.heritageClauses[0].types.map((type) => type.getText());
        }

        // Get the props signatures
        details.properties = Object.keys(symbol.members).sort().map((name) => symbol.members[name])
            .filter(this.filterValueDeclaration)
            .map((sym) => this.serializeDeclaration(sym, fileName))
            .filter(this.filterEntry);
        return details;
    }

    private serializeVariable(symbol: ts.Symbol, fileName: string) {
        const details: IInterfaceEntry = this.serializeSymbol(symbol, fileName);
        details.fileName = fileName;
        if (this.options.includeBasicTypeProperties || !isBasicType(details.type)) {
            // only get properties for a variable if it's not a basic type (or user explicitly enabled basic types)
            details.properties = this.getTypeOfSymbol(symbol).getProperties()
                .filter(this.filterValueDeclaration)
                .map((s) => this.serializeSymbol(s, fileName));
        } else {
            details.properties = [];
        }
        return details;
    }

    // symbols without a `valueDeclaration` will crash things on TS 2.0, so filter these out
    private filterValueDeclaration = (sym: ts.Symbol) => sym.valueDeclaration != null;

    private filterEntry = (entry: IInterfaceEntry) => {
        const { excludeNames, excludePaths } = this.options;
        return testNoMatches(entry.name, excludeNames) && testNoMatches(entry.fileName, excludePaths);
    }
}

/** Returns true if the value matches exactly none of the patterns. */
function testNoMatches(value: string, patterns: Array<string | RegExp> = []) {
    return patterns.every((pattern) => value.match(pattern as string) == null);
}

function isBasicType(type: string) {
    // built-in JS basic type or string literal ("boomtown") or numeric literal (500.6)
    return /(boolean|number|string|RegExp)(\[\])?$/.test(type) || /^("|\d)/.test(type);
}
