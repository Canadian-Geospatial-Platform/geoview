/// <reference types="react" />
/**
 * Zoom in button properties
 */
interface ZoomInProps {
    className?: string;
    iconClassName?: string;
}
/**
 * Create a zoom in button
 *
 * @param {ZoomInProps} props zoom in button properties
 * @returns {JSX.Element} return the created zoom in button
 */
declare function ZoomIn(props: ZoomInProps): JSX.Element;
declare namespace ZoomIn {
    var defaultProps: {
        className: string;
        iconClassName: string;
    };
}
export default ZoomIn;
