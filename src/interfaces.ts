/**
 * A map of all JSDoc @tags to their values.
 * Value-less @tags are coerced to explicit `true` values.
 * Arbitrary camelCased tags are supported via index signature.
 */
export interface IJsDocTags {
    /** default value of this entry. */
    default?: string;

    /** whether this entry is deprecated. string value is the reason. */
    deprecated?: string | true;

    /** whether this entry is internal to the typescript project. */
    internal?: true;

    /** version in which this entry was introduced. */
    since?: string;

    [tag: string]: string | true | undefined;
}

export interface IDocEntry {
    documentation: string;
    fileName: string;
    name: string;
    tags: IJsDocTags;
    type: string;
};

export interface IPropertyEntry extends IDocEntry {
    optional?: boolean;
}

export interface IInterfaceEntry extends IDocEntry {
    extends?: string[];
    properties?: IPropertyEntry[];
}
