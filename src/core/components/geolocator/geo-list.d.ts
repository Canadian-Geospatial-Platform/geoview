import * as React from 'react';
import { GeoListItem } from './geolocator';
type GeoListProps = {
    geoListItems: GeoListItem[];
    zoomToLocation: (coords: [number, number], bbox: [number, number, number, number]) => void;
};
/**
 * Create list of items to display under search.
 * @param {geoListItems} - items to display
 * @param {zoomToLocation} - callback fn to be fired when clicked on geo list item
 * @returns {JSX} - React JSX element
 */
export default function GeoList({ geoListItems, zoomToLocation }: GeoListProps): React.JSX.Element;
export {};
