/// <reference types="react" />
/**
 * Interface used for location button properties
 */
interface LocationProps {
    className?: string | undefined;
}
/**
 * Create a location button to zoom to user location
 *
 * @param {LocationProps} props the location button properties
 * @returns {JSX.Element} the created location button
 */
declare function Location(props: LocationProps): JSX.Element;
declare namespace Location {
    var defaultProps: {
        className: string;
    };
}
export default Location;
