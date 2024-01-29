import React from 'react';
import { GeoListItem } from './geolocator';
interface GeolocatorFiltersType {
    geoLocationData: GeoListItem[];
    searchValue: string;
    error: Error | undefined;
}
/**
 * Component to display filters and geo location result.
 * @param {GeoListItem[]} geoLocationData data to be displayed in result
 * @param {string} searchValue search value entered by the user.
 * @param {Error} error error thrown api call.
 * @returns JSX.Element
 */
export declare function GeolocatorResult({ geoLocationData, searchValue, error }: GeolocatorFiltersType): React.JSX.Element;
export {};
