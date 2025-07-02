import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { VectorTileLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/raster/vector-tile-layer-entry-config';
import { VectorTileGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/vector-tile-group-layer-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
export type TypeVectorTileLayerNode = VectorTileGroupLayerConfig | VectorTileLayerEntryConfig;
/**
 * The vector tile geoview layer class.
 */
export declare class VectorTileLayerConfig extends AbstractGeoviewLayerConfig {
    /**
     * Type of GeoView layer.
     */
    geoviewLayerType: import("../../../map-schema-types").TypeGeoviewLayerType;
    /** The layer entries to use from the GeoView layer. */
    listOfLayerEntryConfig: EntryConfigBaseClass[] | TypeVectorTileLayerNode[];
    /**
     * The class constructor.
     *
     * @param {TypeJsonObject} geoviewLayerConfig The layer configuration we want to instanciate.
     */
    constructor(geoviewLayerConfig: TypeJsonObject);
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
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
     *
     * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
     * @override
     */
    createLeafNode(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the group
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The group node configuration.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer.
     *
     * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
     * @override
     */
    createGroupNode(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass;
    /**
     * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    fetchServiceMetadata(): Promise<void>;
    /**
     * Create a layer entry node for a specific layerId using the service metadata. The node returned can be a
     * layer or a group layer.
     *
     * @param {string} layerId The layer id to use for the subLayer creation.
     * @param {TypeVectorTileLayerNode | undefined} parentNode The layer's parent node.
     *
     * @returns {TypeVectorTileLayerNode} The subLayer created from the metadata.
     * @protected @override
     */
    protected createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass;
    /**
     * Create the layer tree using the service metadata.
     *
     * @returns {TypeJsonObject[]} The layer tree created from the metadata.
     * @protected @override
     */
    protected createLayerTreeFromServiceMetadata(): EntryConfigBaseClass[];
    /** ****************************************************************************************************************************
     * This method search recursively the layerId in the layer entry of the capabilities.
     *
     * @param {string} layerId The layer identifier that must exists on the server.
     * @param {TypeJsonObject | undefined} layer The layer entry from the capabilities that will be searched.
     *
     * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
     */
    findLayerMetadataEntry(layerId: string, metadata?: TypeJsonObject | undefined): TypeJsonObject | null;
}
//# sourceMappingURL=vector-tile-config.d.ts.map