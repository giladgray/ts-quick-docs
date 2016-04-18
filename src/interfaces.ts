export interface IDocEntry {
    documentation?: string;
    inheritedFrom?: string;
    name?: string;
    type?: string;
};

export interface IPropertyEntry extends IDocEntry {
    default?: string;
    deprecated?: boolean;
    internal?: boolean;
    optional?: boolean;
}

export interface IInterfaceEntry extends IDocEntry {
    extends?: string[];
    properties?: IPropertyEntry[];
    fileName?: string;
}
