import type { GeoListItem } from '@/core/components/geolocator/geolocator';
/** Props for the GeoList component. */
type GeoListProps = {
    /** The geolocation items to display. */
    geoListItems: GeoListItem[];
    /** The current search text. */
    searchValue: string;
};
/**
 * Creates the list of geolocation results to display under search.
 *
 * @returns The geolocation result list
 */
export declare function GeoList({ geoListItems, searchValue }: GeoListProps): JSX.Element;
export {};
//# sourceMappingURL=geo-list.d.ts.map