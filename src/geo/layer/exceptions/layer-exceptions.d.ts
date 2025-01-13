import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
export declare class GeoViewLayerError extends GeoViewError {
    geoviewLayerId: string;
    constructor(geoviewLayerId: string, mapId: string);
}
export declare class GeoViewLayerNotCreatedError extends GeoViewLayerError {
    constructor(geoviewLayerId: string, mapId: string);
}
export declare class GeoViewLayerCreatedTwiceError extends GeoViewLayerError {
    geoviewLayer: AbstractGVLayer;
    constructor(geoviewLayer: AbstractGVLayer, mapId: string);
}
