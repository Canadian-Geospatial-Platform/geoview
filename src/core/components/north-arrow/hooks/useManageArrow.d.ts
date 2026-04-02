/** Return type for the useManageArrow hook. */
interface ArrowReturn {
    /** The current rotation angle for the north arrow. */
    rotationAngle: {
        angle: number;
    };
    /** The horizontal offset in pixels for the north arrow. */
    northOffset: number;
}
/**
 * Custom hook to manage north arrow rotation and offset and update store state.
 *
 * @returns The rotation angle and north offset values
 */
export declare const useManageArrow: () => ArrowReturn;
export {};
//# sourceMappingURL=useManageArrow.d.ts.map