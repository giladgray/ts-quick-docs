/**
 * @since 0.5.0
 */
export interface IJsDocInterface {
    /**
     * This one has a custom flag.
     * @customFlag Cool Dude
     */
    customFlag: string;

    /**
     * This one has a default value.
     * @default "gilad"
     */
    default: string;

    /**
     * This one is deprecated.
     * @deprecated
     */
    deprecated: string;

    /**
     * This one is internal.
     * @internal
     */
    internal: boolean;

    /**
     * This one was added recently.
     * @since 0.5.0
     */
    since: string;

    /** This one is optional. */
    optional?: boolean;
}
