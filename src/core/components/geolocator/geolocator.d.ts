/** Geolocation search result item. */
export interface GeoListItem {
    /** Unique key for the item. */
    key: string;
    /** Display name of the location. */
    name: string;
    /** Latitude coordinate. */
    lat: number;
    /** Longitude coordinate. */
    lng: number;
    /** Bounding box as [west, south, east, north]. */
    bbox: [number, number, number, number];
    /** Province or territory name. */
    province: string;
    /** Location category. */
    category: string;
}
/**
 * Creates the geolocator search component.
 *
 * @returns The geolocator component
 */
export declare function Geolocator(): JSX.Element;
//# sourceMappingURL=geolocator.d.ts.map