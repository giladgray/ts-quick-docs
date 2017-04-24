import * as path from "path";
import Documentation, { IDocumentationOptions } from "../src/documentation";
import { IDocEntry, IInterfaceEntry } from "../src/interfaces";

describe("TypeScript Documentation", () => {
    let docs: IInterfaceEntry[];

    it("exists", () => expect(Documentation).toBeDefined());

    it("errors if files is not an array", () => {
        expect(() => Documentation.fromFiles("path" as any, {})).toThrow("expected array");
        expect(() => Documentation.fromFiles(undefined, {})).toThrow("expected array");
    });

    it("returns empty array for empty files", () => {
        const entries = Documentation.fromFiles([], { noLib: true });
        expect(entries).toHaveLength(0);
    });

    describe("options", () => {
        it("excludePaths excludes entire files", () => {
            let excludeDocs = fixture("interface.ts", { excludePaths: ["interface.ts"] });
            expect(excludeDocs).toHaveLength(0);
            excludeDocs = fixture("interface.ts", { excludePaths: [/.*\.ts$/] });
            expect(excludeDocs).toHaveLength(0);
        });

        it("excludeNames excludes named items", () => {
            const excludeDocs = fixture("interface.ts", { excludeNames: ["IInterface"] });
            expect(excludeDocs.map((i) => i.name)).not.toContain("IInterface");
        });

        it("includeDefinitionFiles=true exposes @types symbols", () => {
            const includeDocs = Documentation.fromFiles([], { noLib: true }, { includeDefinitionFiles: true });
            // no source files of our own so everything exposed should come from @types .d.ts files
            includeDocs.map((entry) => expect(entry.fileName).toMatch(/\.d\.ts$/));
        });
    });

    describe("for interfaces", () => {
        beforeAll(() => docs = fixture("interface.ts"));

        it("includes heritage clauses", () => {
            const entry = getEntry(docs, "IChildInterface");
            expect(entry.extends).toEqual(["IInterface", "HTMLElement"]);
        });

        it("includes documentation comment", () => {
            const entry = getEntry(docs, "IInterface");
            expect(entry.documentation).toBeDefined();
            expect(entry.properties.every((p) => p.documentation != null)).toBe(true);
        });

        it("returns interface properties", () => {
            // parameters come out sorted
            expectInterface(docs, "IInterface", ["disabled", "fancy", "lastEdited", "value"]);
        });

        it("detects property type", () => {
            const { properties } = getEntry(docs, "IInterface");
            expect(properties.map((p) => p.type)).toEqual(["boolean", "HTMLElement", "Date", "string"]);
        });

        it("detects optional properties", () => {
            const { properties } = getEntry(docs, "IInterface");
            expect(properties.filter((p) => p.optional).map((p) => p.name)).toEqual(["disabled", "fancy"]);
        });

        it("excludeNames excludes named properties", () => {
            const excludeDocs = fixture("interface.ts", { excludeNames: ["value", /ed$/] });
            expectInterface(excludeDocs, "IInterface", ["fancy"]);
        });
    });

    describe("for consts", () => {
        beforeAll(() => docs = fixture("const.ts"));

        it("returns const properties", () => {
            expectInterface(docs, "colors", ["BLUE", "GREEN", "RED"]);
        });

        it("includeBasicTypeProperties=false has zero string properties", () => {
            const filepath = path.join(__dirname, "fixtures", "const.ts");
            const basicDocs = Documentation.fromFiles([filepath], { noLib: false }, {
                includeBasicTypeProperties: false,
            });
            expect(basicDocs[1].properties).toHaveLength(0); // FILE_NAME
            expect(basicDocs[2].properties).toHaveLength(0); // MAX_WIDTH
        });

        it("includeBasicTypeProperties=true includes tons of string properties", () => {
            const filepath = path.join(__dirname, "fixtures", "const.ts");
            const basicDocs = Documentation.fromFiles([filepath], { noLib: false }, {
                includeBasicTypeProperties: true,
            });
            const properties = basicDocs[1].properties.map((p) => p.name);
            expect(properties).toContain("toString");
            expect(properties).toContain("lastIndexOf");
            expect(properties).toContain("match");
        });
    });

    describe("for classes", () => {
        beforeAll(() => docs = fixture("class.ts"));

        it("includes documentation comment", () => {
            const entry = getEntry(docs, "Class");
            expect(entry.documentation.trim()).toBe("A class");
        });

        it("includes private and public fields", () => {
            const properties = getEntry(docs, "Class").properties;
            expect(properties.length).toBe(2);
            expect(properties[0].name).toBe("privateValue");
            expect(properties[0].documentation.trim()).toBe("private text value");
            expect(properties[1].name).toBe("publicValue");
            expect(properties[1].documentation.trim()).toBe("public text value");
        });
    });

    describe("jsdoc @tags", () => {
        let entry: IInterfaceEntry;
        beforeAll(() => entry = getEntry(fixture("jsdoc.ts"), "IJsDocInterface"));

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
            expect(entry.tags.since).toBe("0.5.0");
        });

        function assertTagExists(tag: string) {
            const { tags } = entry.properties.find((p) => p.name === tag);
            expect(tags[tag]).toBeDefined();
        }
    });

    describe("with external dependencies", () => {
        it("knows about external properties", () => {
            docs = fixture("external.ts", {});
            expect(getEntry(docs, "IReactProps").properties.map((p) => p.type))
                .toEqual(["React.EventHandler<MouseEvent<HTMLElement>>", "React.ReactChild"]);
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
        expect(entry.name).toEqual(name);
        expect(entry.properties.map((p) => p.name)).toEqual(properties);
        expect(entry.properties.every((p) => p.documentation !== ""));
    }
});
