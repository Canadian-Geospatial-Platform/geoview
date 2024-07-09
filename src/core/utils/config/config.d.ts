import { MapConfigLayerEntry } from '@/geo/map/map-schema-types';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
/** *****************************************************************************************************************************
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
    /** ***************************************************************************************************************************
     * The Config class constructor used to instanciate an object of this type.
     * @param {Element} mapElement The map element.
     *
     * @returns {Config} An instance of the Config class.
     */
    constructor(language: TypeDisplayLanguage);
    /** ***************************************************************************************************************************
     * Get a valid map configuration.
     *
     * @param {TypeMapFeaturesConfig} mapFeaturesConfig Config object to validate.
     *
     * @returns {TypeMapFeaturesConfig} A valid map config.
     */
    getValidMapConfig(listOfGeoviewLayerConfig: MapConfigLayerEntry[]): MapConfigLayerEntry[];
    /** ***************************************************************************************************************************
     * Initialize a map config from either inline div, url params, json file.
     *
     * @returns {Promise<TypeMapFeaturesConfig | undefined>} The initialized valid map config.
     */
    initializeMapConfig(mapId: string, listOfGeoviewLayerConfig: MapConfigLayerEntry[]): MapConfigLayerEntry[] | undefined;
}
