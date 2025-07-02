import { GeoListItem } from '@/core/components/geolocator/geolocator';
interface GeolocatorFiltersType {
    geoLocationData: GeoListItem[];
    searchValue: string;
    error: boolean;
}
/**
 * Component to display filters and geo location result.
 * @param {GeoListItem[]} geoLocationData - The data to be displayed in result
 * @param {string} searchValue - The search value entered by the user.
 * @param {boolean} error - If there is an error thrown api call.
 * @returns {JSX.Element}
 */
export declare function GeolocatorResult({ geoLocationData, searchValue, error }: GeolocatorFiltersType): JSX.Element;
export {};
//# sourceMappingURL=geolocator-result.d.ts.map