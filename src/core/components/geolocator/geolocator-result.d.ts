import type { GeoListItem } from '@/core/components/geolocator/geolocator';
/** Props for the GeolocatorResult component. */
interface GeolocatorFiltersType {
    /** The geolocation data to display. */
    geoLocationData: GeoListItem[];
    /** The search value entered by the user. */
    searchValue: string;
    /** Whether an error occurred during the API call. */
    error: boolean;
}
/**
 * Creates the component to display filters and geolocation results.
 *
 * @param props - Properties defined in GeolocatorFiltersType interface
 * @returns The geolocation result component
 */
export declare function GeolocatorResult({ geoLocationData, searchValue, error }: GeolocatorFiltersType): JSX.Element;
export {};
//# sourceMappingURL=geolocator-result.d.ts.map