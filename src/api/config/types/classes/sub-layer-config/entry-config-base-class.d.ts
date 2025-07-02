import { TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeGeoviewLayerType, TypeLayerEntryType, TypeLayerInitialSettings, Extent } from '@/api/config/types/map-schema-types';
/**
 * Base type used to define a GeoView sublayer to display on the map. The sublayer can be a group or an abstract sublayer.
 */
export declare abstract class EntryConfigBaseClass {
    #private;
    /** Used to distinguish layer group nodes. */
    isLayerGroup: boolean;
    /** The identifier of the layer to display on the map. */
    layerId: string;
    /** The display name of the layer (English/French). */
    layerName?: string;
    /** Attributions obtained from the configuration or the metadata. */
    attributions: string[];
    /** Bounds (in lat long) obtained from the metadata or calculated from the layers */
    bounds: Extent | undefined;
    /** Layer entry data type. */
    entryType?: TypeLayerEntryType;
    /** The min scale that can be reach by the layer. */
    minScale: number;
    /** The max scale that can be reach by the layer. */
    maxScale: number;
    /**
     * Initial settings to apply to the GeoView layer entry at creation time. Initial settings are inherited from the parent in the
     * configuration tree.
     */
    initialSettings: TypeLayerInitialSettings;
    /**
     * The class constructor use the sublayer configuration supplied by the user and runs a validation on it to find any errors that
     * may have been made. It only initalizes the properties needed to query the layer metadata for leaf nodes or to create a the
     * layer group.
     *
     * @param {TypeJsonObject} layerConfig The sublayer configuration we want to instanciate.
     * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
     * @constructor
     */
    constructor(layerConfig: TypeJsonObject, geoviewLayerConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass);
    /**
     * The getter method that returns the schemaPath property. Each geoview sublayer type knows what section of the schema must be
     * used to do its validation.
     *
     * @returns {string} The schemaPath associated to the sublayer.
     * @protected @abstract
     */
    protected abstract getSchemaPath(): string;
    /**
     * A method that returns the entryType property. Each sublayer knows what entry type is associated to it.
     *
     * @returns {TypeLayerEntryType} The entryType associated to the sublayer.
     * @protected @abstract
     */
    protected abstract getEntryType(): TypeLayerEntryType;
    /**
     * Fetch the layer metadata from the metadataAccessPath and store it in a private variable of the sublayer.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     *
     * @returns {Promise<void>} A Promise that will resolve when the execution will be completed.
     * @abstract
     */
    abstract fetchLayerMetadata(): Promise<void>;
    /**
     * This method is used to parse the layer metadata and extract the style, source information and other properties.
     * @abstract @protected
     */
    protected abstract parseLayerMetadata(): void;
    /**
     * Validate the node configuration using the schema associated to its layer type.
     * @protected
     */
    protected validateLayerConfig(layerConfig: TypeJsonObject): void;
    /**
     * The setter method that sets the metadata private property. The benifit of using a setter/getter with a
     * private #metadata is that it is invisible to the schema validation and JSON serialization.
     *
     * @param {TypeJsonObject} metadata The sub-layer metadata.
     */
    setLayerMetadata(metadata: TypeJsonObject): void;
    /**
     * The getter method that returns the metadata private property. The benifit of using a setter/getter with a
     * private #metadata is that it is invisible to the schema validation and JSON serialization.
     *
     * @returns {TypeJsonObject} The sub-layer metadata.
     */
    getLayerMetadata(): TypeJsonObject;
    /** The geoview layer type that owns this config entry. */
    getGeoviewLayerType(): TypeGeoviewLayerType;
    /** Set the geoview layer that owns this sub-layer configuration. */
    setGeoviewLayerConfig(geoviewLayerConfig: AbstractGeoviewLayerConfig): void;
    /** The geoview layer that owns this sub-layer configuration. */
    getGeoviewLayerConfig(): AbstractGeoviewLayerConfig;
    /**
     * The getter method, which returns the layerPath of the sublayer configuration. The layer path is a unique identifier
     * associated with the sublayer configuration. It's made up of the Geoview layer identifier and the node identifiers you need
     * to traverse to the targeted sublayer configuration, all separated by slashes '/'.
     *
     * @returns {string} The schemaPath associated to the sublayer.
     */
    getLayerPath(): string;
    /**
     * Method used to set the EntryConfigBaseClass error flag to true. Once this operation has been performed, the layer entry
     * config is no longer considered viable.
     *
     * @param {boolean} value The value to assign to the flag.
     */
    setErrorDetectedFlag(value?: boolean): void;
    /**
     * The getter method that returns the errorDetected flag.
     *
     * @returns {boolean} The errorDetected property associated to the entry config.
     */
    getErrorDetectedFlag(): boolean;
    /**
     * Method used to set the parent node.
     *
     * @param {EntryConfigBaseClass | undefined} parentNode The parent node.
     */
    setParentNode(parentNode: EntryConfigBaseClass | undefined): void;
    /**
     * The getter method that returns the parentNode.
     *
     * @returns {EntryConfigBaseClass | undefined} The parentNode property associated to the entry config.
     */
    getParentNode(): EntryConfigBaseClass | undefined;
    /**
     * This method returns the json string of the entry configuration. The output representation is a multi-line indented
     * string. Indentation can be controled using the ident parameter. Private variables are not serialized.
     * @param {number} indent The number of space to indent the output string (default=2).
     *
     * @returns {string} The json string corresponding to the map feature configuration.
     */
    serialize(indent?: number): string;
    /**
     * Apply default values. The default values will be overwritten by the values in the metadata when they are analyzed.
     * The resulting config will then be overwritten by the values provided in the user config.
     */
    applyDefaultValues(): void;
    /**
     * Create a clone of this node. This method is mainly used to clone a node from the layer tree to store a copy in the
     * list of layer entry config of the GeoView Layer. It was created to preserve the private fields created using the #
     * operator because cloneDeep doesn't copy them to the cloned instance.
     *
     * @param {EntryConfigBaseClass | undefined} parentNode The layer group that owns this node.
     *
     * @returns {EntryConfigBaseClass} The clone copy of the node.
     */
    clone(parentNode?: EntryConfigBaseClass | undefined): EntryConfigBaseClass;
    /**
     * The getter method that returns the sublayer configuration. If the layer path doesn't exists, return undefined.
     *
     * @returns {EntryConfigBaseClass | undefined} The sublayer configuration.
     */
    getSubLayerConfig(layerPath: string): EntryConfigBaseClass | undefined;
}
//# sourceMappingURL=entry-config-base-class.d.ts.map