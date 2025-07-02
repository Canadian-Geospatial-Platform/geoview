import { MapConfigLayerEntry, TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { ConfigValidation } from '@/core/utils/config/config-validation';
/**
 * Class to read and validate the GeoView map features configuration. Will validate every item for structure and valid values.
 * If error found, will replace by default values and sent a message in the console for developers to know something went wrong.
 *
 * @exports
 * @class Config
 */
export declare class Config {
    #private;
    /** The element associated to the map properties configuration.. */
    /** Config validation object used to validate the configuration and define default values */
    configValidation: ConfigValidation;
    /**
     * Constructor
     * @param {TypeDisplayLanguage} language - The language
     */
    constructor(language: TypeDisplayLanguage);
    /**
     * Get a valid map configuration.
     * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig Config object to validate.
     * @returns {MapConfigLayerEntry} A valid map config layer entry.
     */
    getValidMapConfig(listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: (errorKey: string, params: string[]) => void): MapConfigLayerEntry[];
    /**
     * Initialize a map config from either inline div, url params, json file.
     *
     * @returns {Promise<TypeMapFeaturesConfig | undefined>} The initialized valid map config.
     */
    initializeMapConfig(mapId: string, listOfGeoviewLayerConfig: MapConfigLayerEntry[], onErrorCallback: (errorKey: string, params: string[]) => void): MapConfigLayerEntry[] | undefined;
}
//# sourceMappingURL=config.d.ts.map