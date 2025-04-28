import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { WmsGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/wms-group-layer-config';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { WmsLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/raster/wms-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
export type TypeWmsLayerNode = WmsGroupLayerConfig | WmsLayerEntryConfig;
/**
 * The WMS geoview layer class.
 */
export declare class WmsLayerConfig extends AbstractGeoviewLayerConfig {
    #private;
    /**
     * Type of GeoView layer.
     */
    geoviewLayerType: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
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
     * Get the service metadata from the metadataAccessPath and store it in a protected property of the geoview layer.
     * Verify that all sublayers defined in the listOfLayerEntryConfig exist in the metadata and fetch all sublayers metadata.
     * If the metadata layer tree property is defined, build it using the service metadata.
     * @override @async
     */
    fetchServiceMetadata(): Promise<void>;
    /**
     * Create the layer tree using the service metadata.
     *
     * @returns {TypeJsonObject[]} The layer tree created from the metadata.
     * @protected @override
     */
    protected createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[];
    /**
     * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
     * layer or a group layer.
     *
     * @param {string} layerId The layer id to use for the subLayer creation.
     * @param {TypeWmsLayerNode | undefined} parentNode The layer's parent node.
     *
     * @returns {TypeWmsLayerNode} The subLayer created from the metadata.
     * @protected @override
     */
    protected createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass;
    /** ****************************************************************************************************************************
     * This method search recursively the layerId in the layer entry of the capabilities.
     *
     * @param {string} layerId The layer identifier that must exists on the server.
     * @param {TypeJsonObject | undefined} layer The layer entry from the capabilities that will be searched.
     *
     * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
     */
    findLayerMetadataEntry(layerId: string, layer?: TypeJsonObject | undefined): TypeJsonObject | null;
}
