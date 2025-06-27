import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeGeoviewLayerConfig } from '@/api/config/types/map-schema-types';
export type GeoChartGeoCoreConfig = TypeJsonObject & {
    layers: {
        layerId: string;
    };
};
export type GeoChartConfig = TypeJsonObject & {
    layers: {
        layerId: string;
    }[];
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
     * @param {string} baseUrl - The base url of GeoCore API
     * @param {string} lang - The language to get the config for
     * @param {string[]} uuids - A list of uuids to get the configurations for
     * @returns {Promise<UUIDmapConfigReaderResponse>} Layers and Geocharts read and parsed from uuids results from GeoCore
     */
    static getGVConfigFromUUIDs(baseUrl: string, lang: string, uuids: string[]): Promise<UUIDmapConfigReaderResponse>;
}
//# sourceMappingURL=uuid-config-reader.d.ts.map