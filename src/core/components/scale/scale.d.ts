/** The properties for the scale component. */
interface ScaleProps {
    /** Whether the scale is in expanded mode. */
    expanded: boolean;
}
/**
 * Creates a scale component.
 *
 * Memoized to avoid re-rendering when parent updates but scale props remain unchanged.
 *
 * @param props - The scale properties
 * @returns The scale component
 */
export declare const Scale: import("react").NamedExoticComponent<ScaleProps>;
export {};
//# sourceMappingURL=scale.d.ts.map