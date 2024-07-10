import { TypeJsonObject } from '@/core/types/global-types';
import { TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
export type GeoChartGeoCoreConfig = TypeJsonObject & {
    layers: {
        layerId: string;
    };
};
export type GeoChartConfig = TypeJsonObject & {
    layers: [
        {
            layerId: string;
        }
    ];
};
export type UUIDmapConfigReaderResponse = {
    layers: TypeGeoviewLayerConfig[];
    geocharts?: GeoChartConfig[];
};
/**
 * A class to generate GeoView layers config from a URL using a UUID.
 * @exports
 * @class UUIDmapConfigReader
 */
export declare class UUIDmapConfigReader {
    #private;
    /**
     * Generates GeoView layers and package configurations (i.e. geochart), from GeoCore API, using a list of UUIDs.
     * @param {string} baseUrl the base url of GeoCore API
     * @param {string} lang the language to get the config for
     * @param {string[]} uuids a list of uuids to get the configurations for
     * @returns {Promise<UUIDmapConfigReaderResponse>} layers and geocharts read and parsed from uuids results from GeoCore
     */
    static getGVConfigFromUUIDs(baseUrl: string, lang: string, uuids: string[]): Promise<UUIDmapConfigReaderResponse>;
}
