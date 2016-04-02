import { IDocEntry } from "./documentation";

export const FLAGS = [
    "default",
    "deprecated",
    "internal",
];

export function resolveFlags(docEntry: IDocEntry) {
    docEntry.documentation = docEntry.documentation.replace(/(?:\n\s*)?@([\w-]+)(?:\s(\S+))?/g,
        (m: string, flag: string, value = true) => {
            if (FLAGS.indexOf(flag) >= 0) {
                docEntry[flag] = value;
            }
            // remove flag from output
            return "";
        }
    );
    return docEntry;
}
