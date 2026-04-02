/** Properties for the north arrow icon. */
interface NorthArrowIconProps {
    /** The icon width in pixels. */
    width: number;
    /** The icon height in pixels. */
    height: number;
}
/**
 * Creates a north arrow SVG icon.
 *
 * Memoized to prevent re-renders when the parent updates but icon dimensions remain unchanged.
 *
 * @param props - The north arrow icon properties
 * @returns The north arrow SVG element
 */
export declare const NorthArrowIcon: import("react").NamedExoticComponent<NorthArrowIconProps>;
/**
 * Creates a north pole flag SVG icon.
 *
 * Memoized to prevent re-renders since the icon takes no props and never changes.
 *
 * @returns The north pole SVG element
 */
export declare const NorthPoleIcon: import("react").NamedExoticComponent<object>;
export {};
//# sourceMappingURL=north-arrow-icon.d.ts.map