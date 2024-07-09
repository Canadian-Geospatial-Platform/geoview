import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
export declare class GeoViewLayerError extends GeoViewError {
    geoviewLayerId: string;
    constructor(geoviewLayerId: string, mapId: string);
}
export declare class GeoViewLayerNotCreatedError extends GeoViewLayerError {
    constructor(geoviewLayerId: string, mapId: string);
}
export declare class GeoViewLayerCreatedTwiceError extends GeoViewLayerError {
    geoviewLayer: AbstractGeoViewLayer;
    constructor(geoviewLayer: AbstractGeoViewLayer, mapId: string);
}
