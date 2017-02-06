import { expect } from "chai";
import * as path from "path";

import Documentation, { IDocumentationOptions } from "../src/documentation";
import { IDocEntry, IInterfaceEntry } from "../src/interfaces";

describe("TypeScript Documentation", function(this: Mocha.ISuiteCallbackContext) {
    this.slow(2000);
    this.timeout(5000);

    let docs: IInterfaceEntry[];

    it("exists", () => expect(Documentation).to.exist);

    it("returns empty array for empty files", () => expect(Documentation.fromFiles([], { noLib: true })).to.be.empty);

    it("excludePaths excludes entire files", () => {
        let excludeDocs = fixture("interface.ts", { excludePaths: ["interface.ts"] });
        expect(excludeDocs, "supports string pattern").to.be.empty;
        excludeDocs = fixture("interface.ts", { excludePaths: [/.*\.ts$/] });
        expect(excludeDocs, "supports RegExp pattern").to.be.empty;
    });

    it("excludeNames excludes named items", () => {
        const excludeDocs = fixture("interface.ts", { excludeNames: ["IInterface"] });
        expect(excludeDocs.map((i) => i.name)).to.not.contain("IInterface");
    });

    describe("for interfaces", () => {
        before(() => docs = fixture("interface.ts"));

        it("includes heritage clauses", () => {
            const entry = getEntry(docs, "IChildInterface");
            expect(entry.extends).to.deep.equal(["IInterface", "HTMLElement"]);
        });

        it("includes documentation comment", () => {
            const entry = getEntry(docs, "IInterface");
            expect(entry.documentation).to.exist;
            expect(entry.properties.every((p) => p.documentation != null)).to.be.true;
        });

        it("returns interface properties", () => {
            // parameters come out sorted
            expectInterface(docs, "IInterface", ["disabled", "fancy", "lastEdited", "value"]);
        });

        it("detects property type", () => {
            const { properties } = getEntry(docs, "IInterface");
            expect(properties.map((p) => p.type)).to.deep.equal(["boolean", "HTMLElement", "Date", "string"]);
        });

        it("detects optional properties", () => {
            const { properties } = getEntry(docs, "IInterface");
            expect(properties.filter((p) => p.optional).map((p) => p.name)).to.deep.equal(["disabled", "fancy"]);
        });

        it("excludeNames excludes named properties", () => {
            const excludeDocs = fixture("interface.ts", { excludeNames: ["value", /ed$/] });
            expectInterface(excludeDocs, "IInterface", ["fancy"]);
        });
    });

    describe("for consts", () => {
        before(() => docs = fixture("const.ts"));

        it("returns const properties", () => {
            expectInterface(docs, "colors", ["BLUE", "GREEN", "RED"]);
        });

        it("includeBasicTypeProperties=false has zero string properties", () => {
            const filepath = path.join(__dirname, "fixtures", "const.ts");
            const basicDocs = Documentation.fromFiles([filepath], { noLib: false }, {
                ignoreDefinitions: true,
                includeBasicTypeProperties: false,
            });
            expect(basicDocs[1].properties).to.be.empty;
        });

        it("includeBasicTypeProperties=true includes tons of string properties", () => {
            const filepath = path.join(__dirname, "fixtures", "const.ts");
            const basicDocs = Documentation.fromFiles([filepath], { noLib: false }, {
                ignoreDefinitions: true,
                includeBasicTypeProperties: true,
            });
            expect(basicDocs[1].properties.map((p) => p.name)).to.contain.members(["toString", "lastIndexOf", "match"]);
        });
    });

    describe("with external dependencies", () => {
        it("knows about external properties", () => {
            docs = fixture("external.ts", {}, ["./typings/globals/react/index.d.ts"]);
            expect(getEntry(docs, "IReactProps").properties.map((p) => p.type))
                .to.deep.equal(["__React.EventHandler<MouseEvent>", "ReactElement<any> | string | number"]);
        });
    });

    function fixture(fileName: string, options: IDocumentationOptions = {}, additionalFiles: string[] = []) {
        options.excludePaths = (options.excludePaths || []).concat("node_modules/");
        const filepath = path.join(__dirname, "fixtures", fileName);
        return Documentation.fromFiles(additionalFiles.concat(filepath), {}, options);
    }

    function getEntry<T extends IDocEntry>(entries: T[], name: string) {
        for (const entry of entries) {
            if (entry.name === name) { return entry; }
        }
        return null;
    }

    function expectInterface(entries: IInterfaceEntry[], name: string, properties?: string[]) {
        const entry = getEntry(entries, name);
        expect(entry.name).to.deep.equal(name);
        expect(entry.properties.map((p) => p.name)).to.deep.equal(properties);
        expect(entry.properties.every((p) => p.documentation !== ""));
    }
});
