import { TypeJsonObject } from '@config/types/config-types';
import { TypeGeoviewLayerType, TypeDisplayLanguage } from '@config/types/map-schema-types';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
/**
 *  Base class for the definition of a Geoview layer configuration.
 */
export declare abstract class AbstractGeoviewLayerConfig {
    #private;
    /** The GeoView layer identifier. */
    geoviewLayerId: string;
    /**
     * The display name of the layer (English/French). If it is not present the viewer will make an attempt to scrape this
     * information.
     */
    geoviewLayerName: string;
    /** A flag used to indicate that the layer is a GeoCore layer (default: false). When true, geoviewLayerId must be a geocoreId. */
    isGeocore: boolean;
    /** The GeoView layer access path (English/French). */
    metadataAccessPath: string;
    /** Date format used by the service endpoint. */
    serviceDateFormat: string | undefined;
    /** Date format used by the getFeatureInfo to output date variable. */
    externalDateFormat: string | undefined;
    /** Boolean indicating if the layer should be included in time awareness functions such as the Time Slider. True by default. */
    isTimeAware: boolean | undefined;
    /** The layer entries to use from the GeoView layer. */
    listOfLayerEntryConfig: EntryConfigBaseClass[];
    /** Type of GeoView layer. */
    geoviewLayerType: TypeGeoviewLayerType;
    /**
     * The class constructor saves a cloned copy of the Geoview configuration supplied by the user and runs a validation on it to
     * find any errors that may have been made. It only initalizes the properties needed to query the service and layer metadata.
     *
     * @param {TypeJsonObject} userGeoviewLayerConfig The layer configuration that the user has supplied for instantiation.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
     */
    constructor(userGeoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage);
    /**
     * @protected @abstract
     * The getter method that returns the geoview layer schema to use for the validation.
     *
     * @returns {string} The GeoView layer schema associated to the config.
     */
    protected abstract getGeoviewLayerSchema(): string;
    /**
     * @abstract
     * Get the service metadata from the metadataAccessPath and store it in a private variable of the geoview layer.
     * The benifit of using a private #metadata is that it is invisible to the schema validation and JSON serialization.
     */
    abstract fetchServiceMetadata(): Promise<void>;
    /**
     * @abstract
     * The method used to implement the class factory model that returns the instance of the class based on the leaf
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The sublayer configuration.
     * @param {TypeLayerInitialSettings | TypeJsonObject} initialSettings The initial settings inherited.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass | undefined} The sublayer instance or undefined if there is an error.
     */
    abstract createLeafNode(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass | undefined;
    /**
     * @abstract
     * The method used to implement the class factory model that returns the instance of the class based on the group
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The sublayer configuration.
     * @param {TypeLayerInitialSettings | TypeJsonObject} initialSettings The initial settings inherited.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass | undefined} The sublayer instance or undefined if there is an error.
     */
    abstract createGroupNode(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass | undefined;
    /**
     * @protected
     * The setter method that sets the metadataLayerTree private property.
     *
     * @param {TypeJsonObject} metadataLayerTree The GeoView service metadata.
     */
    protected setMetadataLayerTree(metadataLayerTree: EntryConfigBaseClass[]): void;
    /**
     * @protected
     * The getter method that returns the language used to create the geoview layer.
     *
     * @returns {TypeDisplayLanguage} The GeoView layer schema associated to the config.
     */
    protected getLanguage(): TypeDisplayLanguage;
    /**
     * The getter method that returns the serviceMetadata private property.
     *
     * @returns {TypeJsonObject} The GeoView service metadata.
     */
    getServiceMetadata(): TypeJsonObject;
    /**
     * The setter method that sets the metadata private property.
     *
     * @param {TypeJsonObject} metadata The GeoView service metadata.
     */
    setServiceMetadata(metadata: TypeJsonObject): void;
    /**
     * The getter method that returns the metadataLayerTree private property.
     *
     * @returns {EntryConfigBaseClass[]} The metadata layer tree.
     */
    getMetadataLayerTree(): EntryConfigBaseClass[];
    /**
     * The getter method that returns the errorDetected flag.
     *
     * @returns {boolean} The errorDetected property associated to the geoview layer config.
     */
    getErrorDetectedFlag(): boolean;
    /**
     * Methode used to set the AbstractGeoviewLayerConfig error flag to true.
     */
    setErrorDetectedFlag(): void;
    /**
     * The getter method that returns the sublayer configuration. If the layer path doesn't exists, return undefined.
     *
     * @returns {EntryConfigBaseClass | undefined} The sublayer configuration.
     */
    getSubLayerConfig(layerPath: string): EntryConfigBaseClass | undefined;
    /**
     * Sets the error flag for all layers in the provided list of layer entries.
     *
     * @param {EntryConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries.
     */
    setErrorDetectedFlagForAllLayers(listOfLayerEntryConfig: EntryConfigBaseClass[]): void;
    /**
     * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
     * The resulting config will then be overwritten by the values provided in the user config.
     */
    applyDefaultValues(): void;
    /**
     * Apply user configuration over the geoview layer configurations created from the raw metadata.
     *
     * @param {TypeJsonObject} userGeoviewLayerConfig Optional parameter that will replace the configuration provided
     *                                                    at instanciation time.
     */
    applyUserConfig(userGeoviewLayerConfig?: TypeJsonObject): void;
    /**
     * This method returns the json string of the geoview layer's configuration. The output representation is a multi-line indented
     * string. Indentation can be controled using the ident parameter. Private variables are not serialized.
     * @param {number} indent The number of space to indent the output string (default=2).
     *
     * @returns {string} The json string corresponding to the map feature configuration.
     */
    serialize(indent?: number): string;
}
