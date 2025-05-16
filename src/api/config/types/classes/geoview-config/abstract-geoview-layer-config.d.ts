import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeGeoviewLayerType } from '@/api/config/types/map-schema-types';
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
     */
    constructor(userGeoviewLayerConfig: TypeJsonObject);
    /**
     * The getter method that returns the geoview layer schema to use for the validation.
     *
     * @returns {string} The GeoView layer schema associated to the config.
     * @protected @abstract
     */
    protected abstract getGeoviewLayerSchema(): string;
    /**
     * Get the service metadata from the metadataAccessPath and store it in a private variable of the geoview layer.
     * The benifit of using a private #metadata is that it is invisible to the schema validation and JSON serialization.
     * @abstract
     */
    abstract fetchServiceMetadata(): Promise<void>;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the leaf
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The sublayer configuration.
     * @param {TypeLayerInitialSettings | TypeJsonObject} initialSettings The initial settings inherited.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass | undefined} The sublayer instance or undefined if there is an error.
     * @abstract
     */
    abstract createLeafNode(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass | undefined;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the group
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The sublayer configuration.
     * @param {TypeLayerInitialSettings | TypeJsonObject} initialSettings The initial settings inherited.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass | undefined} The sublayer instance or undefined if there is an error.
     * @abstract
     */
    abstract createGroupNode(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass | undefined;
    /**
     * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
     * layer or a group layer.
     *
     * @param {string} layerId The layer id to use for the subLayer creation.
     * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
     *
     * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
     * @protected @abstract
     */
    protected abstract createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass;
    /**
     * Create the layer tree using the service metadata.
     *
     * @returns {TypeJsonObject[]} The layer tree created from the metadata.
     * @protected @abstract
     */
    protected abstract createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[];
    /**
     * Fetch the metadata of all layer entry configurations defined in the list of layer entry config
     * or the ressulting layer tree.
     *
     * @returns {Promise<void>} A promise that will resolve when the process has completed.
     * @protected @async
     */
    protected fetchListOfLayerMetadata(layerTreeFilter?: EntryConfigBaseClass[] | undefined): Promise<void>;
    /**
     * Create the layer tree associated to the GeoView layer if the layer tree filter stored in the metadataLayerTree private property
     * is set.
     * @protected @async
     */
    protected createLayerTree(): Promise<void>;
    /**
     * A recursive method to process the listOfLayerEntryConfig. The goal is to process each valid sublayer, searching the service's
     * metadata to verify the layer's existence and whether it is a layer group, in order to determine the node's final structure.
     * If the metadata indicate the node is a layer group, it will be created by the createLayerEntryNode.
     *
     * @param {EntryConfigBaseClass[]} listOfLayerEntryConfig the list of sublayers to process.
     *
     * @returns {EntryConfigBaseClass[]} the new list of sublayer configurations.
     * @protected
     */
    protected processListOfLayerEntryConfig(listOfLayerEntryConfig: EntryConfigBaseClass[]): EntryConfigBaseClass[];
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
    getMetadataLayerTree(): EntryConfigBaseClass[] | undefined;
    /**
     * The setter method that sets the metadataLayerTree private property.
     *
     * @param {TypeJsonObject} metadataLayerTree The GeoView service metadata.
     */
    setMetadataLayerTree(metadataLayerTree: EntryConfigBaseClass[]): void;
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
