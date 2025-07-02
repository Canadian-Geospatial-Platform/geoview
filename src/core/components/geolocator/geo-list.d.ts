import { GeoListItem } from '@/core/components/geolocator/geolocator';
type GeoListProps = {
    geoListItems: GeoListItem[];
    searchValue: string;
};
/**
 * Create list of items to display under search.
 * @param {GeoListItem[]} geoListItems - The items to display
 * @param {string} searchValue - The search text
 * @returns {JSX.Element} React JSX element
 */
export declare function GeoList({ geoListItems, searchValue }: GeoListProps): JSX.Element;
export {};
//# sourceMappingURL=geo-list.d.ts.map