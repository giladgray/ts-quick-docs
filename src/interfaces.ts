/**
 * A map of all JSDoc @tags to their values.
 * Value-less @tags are coerced to explicit `true` values.
 * Arbitrary camelCased tags are supported via index signature.
 */
export interface IJsDocTags {
    default?: string;
    deprecated?: true;
    internal?: true;
    since?: string;
    [tag: string]: string | true;
}

export interface IDocEntry {
    documentation?: string;
    fileName?: string;
    inheritedFrom?: string;
    name?: string;
    tags: IJsDocTags;
    type?: string;
};

export interface IPropertyEntry extends IDocEntry {
    optional?: boolean;
}

export interface IInterfaceEntry extends IDocEntry {
    extends?: string[];
    properties?: IPropertyEntry[];
}
