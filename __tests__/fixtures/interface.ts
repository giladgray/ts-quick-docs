/** An interface */
export interface IInterface {
    /** text value */
    value: string;

    /** prevent interaction */
    disabled?: boolean;

    /** external type */
    fancy?: HTMLElement;

    /** non-primitive type */
    lastEdited: Date;
}

export interface IChildInterface extends IInterface, HTMLElement {
    property: () => void;
}
