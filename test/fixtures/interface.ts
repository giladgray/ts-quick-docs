/** An interface */
export interface IInterface {
    /** text value */
    value: string;

    /** prevent interaction */
    disabled?: boolean;

    /** external type */
    fancy?: Element;
}

export interface IChildInterface extends IInterface, HTMLElement {
    property: () => void;
}
