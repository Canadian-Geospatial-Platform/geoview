/// <reference types="react" />
export interface GeoListItem {
    key: string;
    name: string;
    lat: number;
    lng: number;
    bbox: [number, number, number, number];
    province: string;
    category: string;
}
export declare function Geolocator(): import("react").JSX.Element;
