/// <reference path="../typings/main.d.ts"/>

import * as path from "path";
import { expect } from "chai";

import { Documentation, IDocEntry } from "../src/documentation";

describe("Documentation", () => {
    it("works", () => expect(Documentation).to.exist);

    it("returns empty array for empty files", () => {
        expect(Documentation.fromFiles([], { noLib: true })).to.be.empty;
    });

    it("returns interface properties", () => {
        const docs = fixture("interface.ts");
        expect(docs).to.have.length(1);
        // parameters come out sorted
        expectEntry(docs[0], "IInterface", ["disabled", "fancy", "value"]);
    });

    it("returns const properties", () => {
        const docs = fixture("const.ts");
        expect(docs).to.have.length(1);
        expectEntry(docs[0], "colors", ["BLUE", "GREEN", "RED"]);
    });

    function fixture(fileName: string) {
        return Documentation.fromFiles([path.join(__dirname, "fixtures", fileName)], { noLib: true });
    }

    function expectEntry(entry: IDocEntry, name: string, parameters?: string[]) {
        expect(entry.name).to.deep.equal(name);
        expect(entry.parameters.map((p) => p.name)).to.deep.equal(parameters);
        expect(entry.parameters.every((p) => p.documentation !== ""));
    }
});
