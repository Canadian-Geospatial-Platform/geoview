/// <reference types="react" />
/**
 * Interface used for geolocator button properties
 */
interface GeolocatorProps {
    sx?: React.CSSProperties;
}
/**
 * Geolocator Button component
 *
 * @returns {JSX.Element} the geolocator button
 */
declare function Geolocator(props: GeolocatorProps): JSX.Element;
declare namespace Geolocator {
    var defaultProps: {
        sx: {};
    };
}
export default Geolocator;
