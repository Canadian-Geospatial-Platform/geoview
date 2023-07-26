/// <reference types="react" />
/**
 * Interface used for geolocator button properties
 */
interface GeolocatorProps {
    mapId: string;
    className?: string | undefined;
}
/**
 * Geolocator Button component
 *
 * @returns {JSX.Element} the geolocator button
 */
declare function Geolocator(props: GeolocatorProps): JSX.Element;
declare namespace Geolocator {
    var defaultProps: {
        className: string;
    };
}
export default Geolocator;
