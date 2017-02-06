import { IDocEntry } from "./interfaces";

export const FLAGS = [
    "default",
    "deprecated",
    "internal",
];

const FLAG_REGEX = /(?:\n\s*)?@([\w-]+)(?:\s([^$@]+))?/g;

export function resolveFlags(docEntry: IDocEntry) {
    docEntry.documentation = docEntry.documentation.replace(FLAG_REGEX,
        (m: string, flag: string, value: string | boolean = true) => {
            if (FLAGS.indexOf(flag) >= 0) {
                docEntry[flag] = value;
            }
            // remove flag from output
            return "";
        },
    );
    return docEntry;
}
