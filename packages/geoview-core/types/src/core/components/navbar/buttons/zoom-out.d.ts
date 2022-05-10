/// <reference types="react" />
/**
 * Zoom out button properties
 */
interface ZoomOutProps {
    className?: string;
    iconClassName?: string;
}
/**
 * Create a zoom out button
 *
 * @param {ZoomOutProps} props the zoom out button properties
 * @returns {JSX.Element} return the new created zoom out button
 */
declare function ZoomOut(props: ZoomOutProps): JSX.Element;
declare namespace ZoomOut {
    var defaultProps: {
        className: string;
        iconClassName: string;
    };
}
export default ZoomOut;
