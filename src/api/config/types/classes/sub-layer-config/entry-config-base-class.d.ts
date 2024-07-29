import { TypeJsonObject } from '@config/types/config-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeGeoviewLayerType, TypeLayerEntryType, TypeLayerInitialSettings, TypeDisplayLanguage, Extent } from '@config/types/map-schema-types';
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
    entryType: TypeLayerEntryType;
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
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
     * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
     * @constructor
     */
    constructor(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewLayerConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass);
    /**
     * Validate the node configuration using the schema associated to its layer type.
     * @protected
     */
    protected validateLayerConfig(layerConfig: TypeJsonObject): void;
    /**
     * Apply default value to undefined fields. The default values to be used for the initialSettings are
     * inherited from the object that owns this sublayer instance.
     *
     * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited by the parent container.
     */
    applyDefaultValueToUndefinedFields(initialSettings: TypeLayerInitialSettings): void;
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
    /** The geoview layer type that owns this config entry. */
    getGeoviewLayerType(): TypeGeoviewLayerType;
    /** The geoview layer that owns this sub-layer configuration. */
    getGeoviewLayerConfig(): AbstractGeoviewLayerConfig;
    /**
     * The getter method, which returns the layerPath of the sublayer configuration. The layer path is a unique identifier
     * associated with the sublayer configuration. It's made up of the Geoview layer identifier and the node identifiers you need
     * to traverse to the targeted sublayer configuration, all separated by slashes '/'.
     *
     * @returns {string} The schemaPath associated to the sublayer.
     */
    getlayerPath(): string;
    /**
     * Method used to set the EntryConfigBaseClass error flag to true. Once this operation has been performed, the layer entry
     * config is no longer considered viable.
     */
    setErrorDetectedFlag(): void;
    /**
     * The getter method that returns the errorDetected flag.
     *
     * @returns {boolean} The errorDetected property associated to the entry config.
     */
    getErrorDetectedFlag(): boolean;
    /**
     * The getter method that returns the parentNode.
     *
     * @returns {EntryConfigBaseClass | undefined} The parentNode property associated to the entry config.
     */
    getParentNode(): EntryConfigBaseClass | undefined;
    /**
     * This method returns the json string of the layer entry configuration. The output representation is not a multi-line indented
     * string. Private variables and pseudo-properties are not serialized.
     *
     * @returns {string} The json string corresponding to the map feature configuration.
     */
    getJsonString(): string;
    /**
     * This method returns the json string of the entry configuration.The output representation is a multi-line indented
     * string. Indentation can be controled using the ident parameter. Private variables and pseudo-properties are not serialized.
     * @param {number | null} indent The number of space to indent the output string.
     *
     * @returns {string} The json string corresponding to the entry configuration.
     */
    getIndentedJsonString(indent?: number | null): string;
}
