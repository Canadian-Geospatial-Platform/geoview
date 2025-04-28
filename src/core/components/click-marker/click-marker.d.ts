import { Coordinate } from 'ol/coordinate';
import { TypeJsonObject } from '@/api/config/types/config-types';
export type TypeClickMarker = {
    lnglat: Coordinate;
    symbology?: TypeJsonObject;
};
/**
 * Create a react element to display a marker ( at the click location) when a user clicks on
 * the map
 *
 * @returns {JSX.Element} the react element with a marker on click
 */
export declare const ClickMarker: import("react").NamedExoticComponent<object>;
