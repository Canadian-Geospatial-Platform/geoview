/// <reference types="react" />
export interface GeoListItem {
    key: string;
    name: string;
    lat: number;
    lng: number;
    bbox: [number, number, number, number];
    province: string;
    tag: (string | null)[] | null;
}
export declare function Geolocator(): JSX.Element;
