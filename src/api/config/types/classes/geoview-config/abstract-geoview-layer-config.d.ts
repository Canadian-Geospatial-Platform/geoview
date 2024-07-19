import { TypeJsonObject } from '@config/types/config-types';
import { TypeGeoviewLayerType, TypeDisplayLanguage, TypeLayerInitialSettings } from '@config/types/map-schema-types';
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
    /** Initial settings to apply to the GeoView layer at creation time. */
    initialSettings: TypeLayerInitialSettings;
    /**
     * The class constructor saves a cloned copy of the Geoview configuration supplied by the user and runs a validation on it to
     * find any errors that may have been made. It only initalizes the properties needed to query the service and layer metadata.
     *
     * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
     */
    constructor(geoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage);
    /**
     * Apply default value to undefined fields.
     */
    applyDefaultValueToUndefinedFields(): void;
    /**
     * Get the service metadata from the metadataAccessPath and store it in a private variable of the geoview layer.
     * The benifit of using a private #metadata is that it is invisible to the schema validation and JSON serialization.
     * @abstract
     */
    abstract fetchServiceMetadata(): Promise<void>;
    /**
     * The setter method that sets the metadata private property. The benifit of using a setter/getter with a
     * private #metadata is that it is invisible to the schema validation and JSON serialization.
     *
     * @param {TypeJsonObject} metadata The GeoView service metadata.
     * @protected
     */
    protected set metadata(metadata: TypeJsonObject);
    /**
     * The getter method that returns the metadata private property. The benifit of using a setter/getter with a
     * private #metadata is that it is invisible to the schema validation and JSON serialization.
     *
     * @returns {TypeJsonObject} The GeoView service metadata.
     * @protected
     */
    protected get metadata(): TypeJsonObject;
    /**
     * The getter method that returns the metadataLayerTree private property. The benifit of using a setter/getter with a
     * private #metadataLayerTree is that it is invisible to the schema validation and JSON serialization.
     *
     * @returns {EntryConfigBaseClass[]} The metadata layer tree.
     */
    get metadataLayerTree(): EntryConfigBaseClass[];
    /**
     * The setter method that sets the metadataLayerTree private property. The benifit of using a setter/getter with a
     * private #metadata is that it is invisible to the schema validation and JSON serialization.
     *
     * @param {TypeJsonObject} metadataLayerTree The GeoView service metadata.
     * @protected
     */
    protected set metadataLayerTree(metadataLayerTree: EntryConfigBaseClass[]);
    /**
     * The getter method that returns the language used to create the geoview layer.
     *
     * @returns {TypeDisplayLanguage} The GeoView layer schema associated to the config.
     * @protected @abstract
     */
    protected get language(): TypeDisplayLanguage;
    /**
     * The getter method that returns the geoview layer schema to use for the validation.
     *
     * @returns {string} The GeoView layer schema associated to the config.
     * @protected @abstract
     */
    protected abstract get geoviewLayerSchema(): string;
    /**
     * The getter method that returns the geoview layer type to use for the validation.
     *
     * @returns {string} The GeoView layer schema associated to the config.
     * @protected @abstract
     */
    abstract get geoviewLayerType(): TypeGeoviewLayerType;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the sublayer
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The sublayer configuration.
     * @param {TypeLayerInitialSettings | TypeJsonObject} initialSettings The initial settings inherited.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass | undefined} The sublayer instance or undefined if there is an error.
     * @abstract
     */
    abstract createLeafNode(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass | undefined;
    /**
     * Methode used to set the AbstractGeoviewLayerConfig error flag to true.
     */
    setErrorDetectedFlag(): void;
    /**
     * The getter method that returns the errorDetected flag.
     *
     * @returns {boolean} The errorDetected property associated to the geoview layer config.
     */
    get errorDetected(): boolean;
    /**
     * This method returns the json string of the geoview layer's configuration. The output representation is a multi-line indented
     * string. Indentation can be controled using the ident parameter. Private variables and pseudo-properties are not serialized.
     * @param {number} indent The number of space to indent the output string (default=2).
     *
     * @returns {string} The json string corresponding to the map feature configuration.
     */
    serialize(indent?: number): string;
}
