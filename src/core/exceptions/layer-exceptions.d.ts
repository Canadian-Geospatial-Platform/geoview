import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { TypeJsonArray, TypeJsonValue } from '@/api/config/types/config-types';
import { TypeLayerEntryConfig } from '@/api/config/types/map-schema-types';
export declare class GeoViewLayerError extends GeoViewError {
    geoviewLayerId: string;
    constructor(mapId: string, geoviewLayerId: string, localizedKeyOrMessage?: string | undefined, params?: TypeJsonValue[] | TypeJsonArray | string[] | undefined);
}
export declare class GeoViewLayerNotCreatedError extends GeoViewLayerError {
    constructor(mapId: string, geoviewLayerId: string);
}
export declare class GeoViewLayerLoadedFailedError extends GeoViewLayerError {
    layerConfig: TypeLayerEntryConfig;
    constructor(mapId: string, layerConfig: TypeLayerEntryConfig, localizedKeyOrMessage: string, params?: TypeJsonValue[] | TypeJsonArray | string[] | undefined);
}
export declare class GeoViewLayerCreatedTwiceError extends GeoViewLayerError {
    constructor(mapId: string, geoviewLayerId: string);
}
