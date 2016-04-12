/// <reference path="../typings/main.d.ts"/>

import * as path from "path";
import { expect } from "chai";

import Documentation, { IInterfaceEntry } from "../src/documentation";

describe("Documentation", () => {
    it("works", () => expect(Documentation).to.exist);

    it("returns empty array for empty files", () => {
        expect(Documentation.fromFiles([], { noLib: true })).to.be.empty;
    });

    it("returns interface properties", () => {
        const docs = fixture("interface.ts");
        expect(docs).to.have.length(1);
        // parameters come out sorted
        expectInterface(docs[0], "IInterface", ["disabled", "fancy", "value"]);
    });

    it("returns const properties", () => {
        const docs = fixture("const.ts");
        expect(docs).to.have.length(1);
        expectInterface(docs[0], "colors", ["BLUE", "GREEN", "RED"]);
    });

    function fixture(fileName: string) {
        const filepath = path.join(__dirname, "fixtures", fileName);
        return Documentation.fromFiles([filepath], { noLib: true });
    }

    function expectInterface(entry: IInterfaceEntry, name: string, properties?: string[]) {
        expect(entry.name).to.deep.equal(name);
        expect(entry.properties.map((p) => p.name)).to.deep.equal(properties);
        expect(entry.properties.every((p) => p.documentation !== ""));
    }
});
