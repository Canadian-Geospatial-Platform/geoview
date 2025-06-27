import { TypeJsonObject } from '@/api/config/types/config-types';
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
     * @returns {Promise<TypeJsonObject[]>} layers and geocharts read and parsed from uuids results from GeoCore
     */
    static getGVConfigFromUUIDs(baseUrl: string, lang: string, uuids: string[]): Promise<TypeJsonObject[]>;
}
//# sourceMappingURL=uuid-config-reader.d.ts.map