/**
 * Custom hook to Manage North arrow.
 * @returns rotationAngle and northoffset
 */
declare const useManageArrow: () => {
    rotationAngle: {
        angle: number;
    };
    northOffset: number;
};
export default useManageArrow;
