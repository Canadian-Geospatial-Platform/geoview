interface ArrowReturn {
    rotationAngle: {
        angle: number;
    };
    northOffset: number;
}
/**
 * Custom hook to Manage North arrow.
 * @returns rotationAngle and northoffset
 */
declare const useManageArrow: () => ArrowReturn;
export default useManageArrow;
