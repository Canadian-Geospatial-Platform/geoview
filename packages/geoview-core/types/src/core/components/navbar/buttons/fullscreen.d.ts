/// <reference types="react" />
/**
 * Interface used for fullscreen button properties
 */
interface FullscreenProps {
    className?: string;
    iconClassName?: string;
}
/**
 * Create a toggle button to toggle between fullscreen
 *
 * @param {FullscreenProps} props the fullscreen button properties
 * @returns {JSX.Element} the fullscreen toggle button
 */
declare function Fullscreen(props: FullscreenProps): JSX.Element;
declare namespace Fullscreen {
    var defaultProps: {
        className: string;
        iconClassName: string;
    };
}
export default Fullscreen;
