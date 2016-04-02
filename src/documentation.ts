import * as ts from "typescript";
import * as path from "path";
import { resolveFlags } from "./flags";

export interface IDocEntry {
    documentation?: string;
    name?: string;
    type?: string;
};

export interface IPropertyEntry extends IDocEntry {
    default?: string;
    deprecated?: boolean;
    internal?: boolean;
    optional?: boolean;
}

export interface IInterfaceEntry extends IDocEntry {
    properties?: IPropertyEntry[];
    fileName?: string;
}

export interface IFunctionEntry extends IDocEntry {
    parameters?: IPropertyEntry[];
    returnType?: string;
}

export interface IClassEntry extends IInterfaceEntry {
    constructors?: IFunctionEntry[];
}

export interface IDocumentationOptions {
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
            if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                // This is a top level class, get its symbol
                let symbol = this.checker.getSymbolAtLocation((<ts.ClassDeclaration>node).name);
                output.push(this.serializeClass(symbol, this.getFileName(node)));
            } else if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
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
            if (this.options.ignoreDefinitions && /\.d\.ts$/.test(sourceFile.fileName)) { continue; }
            // Walk the tree to search for classes
            ts.forEachChild(sourceFile, visit);
        }
        return output;
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

    /** Serialize a class symbol infomration */
    private serializeClass(symbol: ts.Symbol, fileName: string) {
        let details: IClassEntry = this.serializeSymbol(symbol);
        details.fileName = fileName;

        // Get the construct signatures
        let constructorType = this.getTypeOfSymbol(symbol);
        details.constructors = constructorType.getConstructSignatures().map(this.serializeSignature);
        return details;
    }

    private serializeInterface(symbol: ts.Symbol, fileName: string) {
        let details: IInterfaceEntry = this.serializeSymbol(symbol);
        details.fileName = fileName;
        details.type = "interface";

        // Get the props signatures
        details.properties = Object.keys(symbol.members).sort()
            .map((name) => this.serializeDeclaration(symbol.members[name]));
        return details;
    }

    private serializeVariable(symbol: ts.Symbol, fileName: string) {
        let details: IInterfaceEntry = this.serializeSymbol(symbol);
        details.fileName = fileName;
        details.properties = this.getTypeOfSymbol(symbol).getProperties().map((s) => this.serializeSymbol(s));
        return details;
    }

    private serializeDeclaration(symbol: ts.Symbol) {
        let details: IPropertyEntry = this.serializeSymbol(symbol);
        details.optional = (symbol.flags & ts.SymbolFlags.Optional) !== 0;
        return resolveFlags(details);
    }

    /** Serialize a signature (call or construct) */
    private serializeSignature = (signature: ts.Signature): IFunctionEntry => {
        return {
            documentation: ts.displayPartsToString(signature.getDocumentationComment()),
            parameters: signature.parameters.map((symbol) => this.serializeSymbol(symbol)),
            returnType: this.checker.typeToString(signature.getReturnType()),
            type: this.checker.typeToString(signature.typePredicate.type),
        };
    };

}
