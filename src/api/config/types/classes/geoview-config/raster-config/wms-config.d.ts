import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { WmsGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/wms-group-layer-config';
import { TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { WmsLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/raster/wms-layer-entry-config';
import { EntryConfigBaseClass } from '@config/types/classes/sub-layer-config/entry-config-base-class';
export type TypeWmsLayerNode = WmsGroupLayerConfig | WmsLayerEntryConfig;
/**
 * The WMS geoview layer class.
 */
export declare class WmsLayerConfig extends AbstractGeoviewLayerConfig {
    #private;
    /**
     * Type of GeoView layer.
     */
    geoviewLayerType: import("@config/types/map-schema-types").TypeGeoviewLayerType;
    /** The layer entries to use from the GeoView layer. */
    listOfLayerEntryConfig: TypeWmsLayerNode[];
    /**
     * The class constructor.
     *
     * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
     */
    constructor(geoviewLayerConfig: TypeJsonObject, language: TypeDisplayLanguage);
    /**
     * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
     * section of the schema must be used to do its validation.
     *
     * @returns {string} The GeoView layer schema associated to the config.
     * @protected @override
     */
    protected getGeoviewLayerSchema(): string;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the sublayer
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The sublayer configuration.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
     *
     * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
     * @override
     */
    createLeafNode(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the group
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The group node configuration.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
     *
     * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
     * @override
     */
    createGroupNode(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass;
    /**
     * Get the service metadata from the metadataAccessPath and store it in the private property of the geoview layer.
     * @override @async
     */
    fetchServiceMetadata(): Promise<void>;
    /**
     * Create the layer tree using the service metadata.
     *
     * @returns {TypeJsonObject[]} The layer tree created from the metadata.
     * @protected
     */
    protected createLayerTree(): EntryConfigBaseClass[];
    /** ****************************************************************************************************************************
     * This method search recursively the layerId in the layer entry of the capabilities.
     *
     * @param {string} layerId The layer identifier that must exists on the server.
     * @param {TypeJsonObject | undefined} layer The layer entry from the capabilities that will be searched.
     *
     * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
     * @static
     */
    static getLayerMetadataEntry(layerId: string, layer: TypeJsonObject | undefined): TypeJsonObject | null;
}
