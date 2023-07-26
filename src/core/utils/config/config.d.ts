import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';
import { TypeMapFeaturesConfig } from '../../types/global-types';
import { ConfigValidation } from './config-validation';
export declare const catalogUrl = "https://maps.canada.ca/geonetwork/srv/api/v2/docs";
/** *****************************************************************************************************************************
 * Class to read and validate the GeoView map features configuration. Will validate every item for structure and valid values.
 * If error found, will replace by default values and sent a message in the console for developers to know something went wrong.
 *
 * @exports
 * @class Config
 */
export declare class Config {
    /** The element associated to the map properties configuration.. */
    private mapElement;
    /** Config validation object used to validate the configuration and define default values */
    configValidation: ConfigValidation;
    /** ***************************************************************************************************************************
     * The Config class constructor used to instanciate an object of this type.
     * @param {Element} mapElement The map element.
     *
     * @returns {Config} An instance of the Config class.
     */
    constructor(mapElement: Element);
    /** ***************************************************************************************************************************
     * Get mapId value.
     *
     * @returns {string} The ID of the Geoview map.
     */
    get mapId(): string;
    /** ***************************************************************************************************************************
     * Set mapId value.
     * @param {string} mapId The ID of the Geoview map.
     */
    set mapId(mapId: string);
    /** ***************************************************************************************************************************
     * Get triggerReadyCallback value.
     *
     * @returns {boolean} The triggerReadyCallback flag of the Geoview map.
     */
    get triggerReadyCallback(): boolean;
    /** ***************************************************************************************************************************
     * Set triggerReadyCallback value.
     * @param {string} triggerReadyCallback The value to assign to the triggerReadyCallback flag for the Geoview map.
     */
    set triggerReadyCallback(triggerReadyCallback: boolean);
    /** ***************************************************************************************************************************
     * Get displayLanguage value.
     *
     * @returns {TypeDisplayLanguage} The display language of the Geoview map.
     */
    get displayLanguage(): TypeDisplayLanguage;
    /** ***************************************************************************************************************************
     * Set displayLanguage value.
     * @param {TypeDisplayLanguage} displayLanguage The display language of the Geoview map.
     */
    set displayLanguage(displayLanguage: TypeDisplayLanguage);
    /** ***************************************************************************************************************************
     * Get map properties configuration from a function call.
     *
     * @param {TypeMapFeaturesConfig} mapFeaturesConfig Config object passed in the function.
     *
     * @returns {TypeMapFeaturesConfig} A valid map config.
     */
    getMapConfigFromFunc(mapFeaturesConfig: TypeMapFeaturesConfig): TypeMapFeaturesConfig | undefined;
    /** ***************************************************************************************************************************
     * Initialize all layer entry type fields accordingly to the GeoView layer type..
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entry configuration to adjust.
     * @param {TypeGeoviewLayerType} geoviewLayerType The GeoView layer type.
     */
    private setLayerEntryType;
    /** ***************************************************************************************************************************
     * Initialize a map config from either inline div, url params, json file.
     *
     * @returns {Promise<TypeMapFeaturesConfig | undefined>} The initialized valid map config.
     */
    initializeMapConfig(): Promise<TypeMapFeaturesConfig | undefined>;
}
