import { TypeBasemapOptions } from '../../../geo/layer/basemap/basemap-types';
import { TypeDisplayLanguage, TypeValidMapProjectionCodes, TypeValidVersions, TypeListOfGeoviewLayerConfig, TypeListOfLocalizedLanguages } from '../../../geo/map/map-schema-types';
import { TypeMapFeaturesConfig } from '../../types/global-types';
/** *****************************************************************************************************************************
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
export declare class ConfigValidation {
    /** The map ID associated to the configuration. If it is undefined, a unique value will be generated and assign to it. */
    private _mapId;
    /** The triggerReadyCallback flag associated to the configuration. Default value is false. */
    private _triggerReadyCallback;
    /** The language that will be used to display the GeoView layer. */
    private _displayLanguage;
    /** default configuration if provided configuration is missing or wrong */
    private _defaultMapFeaturesConfig;
    private _basemapId;
    private _basemapShaded;
    private _basemaplabeled;
    private _center;
    /** ***************************************************************************************************************************
     * The ConfigValidation class constructor used to instanciate an object of this type.
     *
     * @returns {ConfigValidation} An ConfigValidation instance.
     */
    constructor();
    /** ***************************************************************************************************************************
     * Get map features configuration object.
     *
     * @returns {TypeMapFeaturesConfig} The map features configuration.
     */
    get defaultMapFeaturesConfig(): TypeMapFeaturesConfig;
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
     * @param {boolean} triggerReadyCallback The value to assign to the triggerReadyCallback flag for the Geoview map.
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
     * Validate basemap options.
     * @param {TypeValidMapProjectionCodes} projection The projection code of the basemap.
     * @param {TypeBasemapOptions} basemapOptions The basemap options to validate.
     *
     * @returns {TypeBasemapOptions} A valid basemap options.
     */
    validateBasemap(projection?: TypeValidMapProjectionCodes, basemapOptions?: TypeBasemapOptions): TypeBasemapOptions;
    /** ***************************************************************************************************************************
     * Validate map version.
     * @param {TypeValidVersions} version The version to validate.
     *
     * @returns {TypeValidVersions} A valid version.
     */
    validateVersion(version?: TypeValidVersions): TypeValidVersions;
    /** ***************************************************************************************************************************
     * Validate map config language.
     * @param {TypeDisplayLanguage} language The language to validate.
     *
     * @returns {TypeDisplayLanguage} A valid language.
     */
    validateDisplayLanguage(language?: TypeDisplayLanguage): TypeDisplayLanguage;
    /** ***************************************************************************************************************************
     * Validate zoom level.
     * @param {number} zoom The zoom level to validate.
     *
     * @returns {number} A valid zoom level.
     */
    private validateZoom;
    /** ***************************************************************************************************************************
     * Validate min zoom level.
     * @param {number} zoom The zoom level to validate.
     *
     * @returns {number} A valid zoom level.
     */
    private validateMinZoom;
    /** ***************************************************************************************************************************
     * Validate max zoom level.
     * @param {number} zoom The zoom level to validate.
     *
     * @returns {number} A valid zoom level.
     */
    private validateMaxZoom;
    /** ***************************************************************************************************************************
     * Validate projection.
     * @param {TypeValidMapProjectionCodes} projection The projection to validate.
     *
     * @returns {TypeValidMapProjectionCodes} A valid projection.
     */
    private validateProjection;
    /** ***************************************************************************************************************************
     * Validate the center.
     * @param {TypeValidMapProjectionCodes} projection The projection used by the map.
     * @param {[number, number]} center The map center to valdate.
     *
     * @returns {[number, number]} A valid map center.
     */
    private validateCenter;
    /** ***************************************************************************************************************************
     * Validate the map features configuration.
     * @param {TypeMapFeaturesConfig} mapFeaturesConfigToValidate The map features configuration to validate.
     *
     * @returns {TypeMapFeaturesConfig} A valid map features configuration.
     */
    validateMapConfigAgainstSchema(mapFeaturesConfigToValidate?: TypeMapFeaturesConfig): TypeMapFeaturesConfig;
    /** ***************************************************************************************************************************
     * Validate and adjust the list of GeoView layer configuration.
     * @param {TypeListOfLocalizedLanguages} suportedLanguages The list of supported languages.
     * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of GeoView layer configuration to adjust and
     * validate.
     */
    validateListOfGeoviewLayerConfig(suportedLanguages: TypeListOfLocalizedLanguages, listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig): void;
    /** ***************************************************************************************************************************
     * Do extra validation that schema can not do.
     * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of GeoView layer configuration to adjust and
     * validate.
     */
    private doExtraValidation;
    /** ***************************************************************************************************************************
     * Verify that the metadataAccessPath has a value.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration to validate.
     */
    private metadataAccessPathIsMandatory;
    /** ***************************************************************************************************************************
     * Verify that the geoviewLayerId has a value.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration to validate.
     */
    private geoviewLayerIdIsMandatory;
    /** ***************************************************************************************************************************
     * Process recursively the layer entries to create layers and layer groups.
     * @param {TypeGeoviewLayerConfig} rootLayerConfig The GeoView layer configuration to adjust and validate.
     * @param {TypeGeoviewLayerConfig | TypeLayerGroupEntryConfig} parentLayerConfig The parent layer configuration of all the
     * layer entry configurations found in the list of layer entries.
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entry configurations to process.
     */
    private processLayerEntryConfig;
    /** ***************************************************************************************************************************
     * Synchronize the English and French strings.
     * @param {TypeLocalizedString} localizedString The localized string to synchronize the en and fr string.
     * @param {TypeDisplayLanguage} sourceKey The source's key.
     * @param {TypeDisplayLanguage} destinationKey The destination's key.
     *
     * @returns {TypeMapFeaturesConfig} A valid JSON configuration object.
     */
    private SynchronizeLocalizedString;
    /** ***************************************************************************************************************************
     * Adjust the map features configuration localized strings according to the suported languages array content.
     * @param {TypeListOfLocalizedLanguages} suportedLanguages The list of supported languages.
     * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of GeoView layer configuration to adjust according
     * to the suported languages array content.
     */
    private processLocalizedString;
    /** ***************************************************************************************************************************
     * Adjust the map features configuration to make it valid.
     * @param {TypeMapFeaturesConfig} config The map features configuration to adjust.
     *
     * @returns {TypeMapFeaturesConfig} A valid JSON configuration object.
     */
    private adjustMapConfiguration;
    /** ***************************************************************************************************************************
     * Log modifications made to configuration by the validator.
     * @param {TypeMapFeaturesConfig} inputMapFeaturesConfig input config.
     * @param {TypeMapFeaturesConfig} validMapFeaturesConfig valid config.
     */
    private logModifs;
}
