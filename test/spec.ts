import { expect } from "chai";
import * as path from "path";
import Documentation, { IDocumentationOptions } from "../src/documentation";
import { IDocEntry, IInterfaceEntry } from "../src/interfaces";

describe("TypeScript Documentation", function(this: Mocha.ISuiteCallbackContext) {
    this.slow(2000);
    this.timeout(5000);

    let docs: IInterfaceEntry[];

    it("exists", () => expect(Documentation).to.exist);

    it("errors if files is not an array", () => {
        expect(() => Documentation.fromFiles("path" as any, {})).to.throw("expected array");
        expect(() => Documentation.fromFiles(undefined, {})).to.throw("expected array");
    });

    it("returns empty array for empty files", () => {
        const entries = Documentation.fromFiles([], { noLib: true });
        expect(entries).to.be.empty;
    });

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

    it("includeDefinitionFiles=true exposes @types symbols", () => {
        const includeDocs = Documentation.fromFiles([], { noLib: true }, { includeDefinitionFiles: true });
        // no source files of our own so everything exposed should come from @types .d.ts files
        includeDocs.map((entry) => expect(entry.fileName).to.match(/\.d\.ts$/));
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
                includeBasicTypeProperties: false,
            });
            expect(basicDocs[1].properties).to.be.empty; // FILE_NAME
            expect(basicDocs[2].properties).to.be.empty; // MAX_WIDTH
        });

        it("includeBasicTypeProperties=true includes tons of string properties", () => {
            const filepath = path.join(__dirname, "fixtures", "const.ts");
            const basicDocs = Documentation.fromFiles([filepath], { noLib: false }, {
                includeBasicTypeProperties: true,
            });
            expect(basicDocs[1].properties.map((p) => p.name)).to.contain.members(["toString", "lastIndexOf", "match"]);
        });
    });

    describe("for classes", () => {
        before(() => docs = fixture("class.ts"));

        it("includes documentation comment", () => {
            const entry = getEntry(docs, "Class");
            expect(entry.documentation.trim()).equals("A class");
        });

        it("includes private and public fields", () => {
            const properties = getEntry(docs, "Class").properties;
            expect(properties.length).equals(2);
            expect(properties[0].name).equals("privateValue");
            expect(properties[0].documentation.trim()).equals("private text value");
            expect(properties[1].name).equals("publicValue");
            expect(properties[1].documentation.trim()).equals("public text value");
        });
    });

    describe("jsdoc @tags", () => {
        let entry: IInterfaceEntry;
        before(() => entry = getEntry(fixture("jsdoc.ts"), "IJsDocInterface"));

        [
            "default",
            "deprecated",
            "internal",
            "since",
            "customFlag",
        ].forEach((tag) => {
            it(`detects @${tag}`, () => assertTagExists(tag));
        });

        it("works on interfaces too", () => {
            expect(entry.tags.since).to.equal("0.5.0");
        });

        function assertTagExists(tag: string) {
            const { tags } = entry.properties.find((p) => p.name === tag);
            expect(tags[tag]).to.exist;
        }
    });

    describe("with external dependencies", () => {
        it("knows about external properties", () => {
            docs = fixture("external.ts", {});
            expect(getEntry(docs, "IReactProps").properties.map((p) => p.type))
                .to.deep.equal(["React.EventHandler<MouseEvent<HTMLElement>>", "React.ReactChild"]);
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
