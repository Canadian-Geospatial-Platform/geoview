/// <reference types="react" />
import { GeoListItem } from './geolocator';
type GeoListProps = {
    geoListItems: GeoListItem[];
};
/**
 * Create list of items to display under search.
 * @param {geoListItems} - items to display
 * @returns {JSX} - React JSX element
 */
export default function GeoList({ geoListItems }: GeoListProps): import("react").JSX.Element;
export {};
