/// <reference path="../typings/index.d.ts"/>

import * as path from "path";
import { expect } from "chai";
import { ModuleKind } from "typescript";

import Documentation, { IDocumentationOptions } from "../src/documentation";
import { IDocEntry, IInterfaceEntry } from "../src/interfaces";

describe("TypeScript Documentation", function (this: Mocha) {
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
        let excludeDocs = fixture("interface.ts", { excludeNames: ["IInterface"] });
        expect(excludeDocs.map(i => i.name)).to.not.contain("IInterface");
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
            expect(entry.properties.every(p => p.documentation != null)).to.be.true;
        });

        it("returns interface properties", () => {
            // parameters come out sorted
            expectInterface(docs, "IInterface", ["disabled", "fancy", "value"]);
        });

        it("detects property type", () => {
            const { properties } = getEntry(docs, "IInterface");
            expect(properties.map(p => p.type)).to.deep.equal(["boolean", "any", "string"]);
        });

        it("detects optional properties", () => {
            const { properties } = getEntry(docs, "IInterface");
            expect(properties.filter(p => p.optional).map(p => p.name)).to.deep.equal(["disabled", "fancy"]);
        });

        it("excludeNames excludes named properties", () => {
            let excludeDocs = fixture("interface.ts", { excludeNames: ["value", /^f/] });
            expectInterface(excludeDocs, "IInterface", ["disabled"]);
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
            expect(basicDocs[1].properties.map(p => p.name)).to.contain.members(["toString", "lastIndexOf", "match"]);
        });
    });

    function fixture(fileName: string, options?: IDocumentationOptions) {
        const filepath = path.join(__dirname, "fixtures", fileName);
        return Documentation.fromFiles([filepath], { noLib: true }, options);
    }

    function getEntry<T extends IDocEntry>(entries: T[], name: string) {
        for (let entry of entries) {
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
