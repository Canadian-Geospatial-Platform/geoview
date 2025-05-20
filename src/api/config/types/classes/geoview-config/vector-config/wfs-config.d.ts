import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { WfsGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/wfs-group-layer-config';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { WfsLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/vector/wfs-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
export type TypeWfsLayerNode = WfsGroupLayerConfig | WfsLayerEntryConfig;
/**
 * The WFS geoview layer class.
 */
export declare class WfsLayerConfig extends AbstractGeoviewLayerConfig {
    /**
     * Type of GeoView layer.
     */
    geoviewLayerType: import("../../../map-schema-types").TypeGeoviewLayerType;
    /** The layer entries to use from the GeoView layer. */
    listOfLayerEntryConfig: EntryConfigBaseClass[] | TypeWfsLayerNode[];
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
     * Get the service metadata from the metadataAccessPath and store it in the private property of the geoview layer.
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
     * Create a layer entry node for a specific layerId using the service metadata. The node returned can only be a
     * layer because the concept of group layer doesn't exist in WFS.
     *
     * @param {string} layerId The layer id to use for the subLayer creation.
     * @param {EntryConfigBaseClass | undefined} parentNode The layer's parent node.
     *
     * @returns {EntryConfigBaseClass} The subLayer created from the metadata.
     * @protected @override
     */
    protected createLayerEntryNode(layerId: string, parentNode: EntryConfigBaseClass | undefined): EntryConfigBaseClass;
    /**
     * Process URL parameters. If a parameter is not provided by the user, a default value will be used.
     * Defaults are: service=WFS
     *               request=GetCapabilities
     *               version=2.0.0
     *
     * @param {string} requestToExecute The request to execute (default=GetCapabilities).
     *
     * @returns {string} The new URL.
     * @public
     */
    processUrlParameters(requestToExecute?: string): string;
    /**
     * Extract the WFS version from the URL provided by the user. If version is unspecified, version 2.0.0 will be used.
     *
     * @returns {string} The version number.
     * @public
     */
    getWfsVersion(): string;
    /** ****************************************************************************************************************************
     * This method search recursively the layerId in the layer entry of the capabilities.
     *
     * @param {string} layerId The layer identifier that must exists on the server.
     *
     * @returns {TypeJsonObject | null} The found layer from the capabilities or null if not found.
     */
    findLayerMetadataEntry(layerId: string): TypeJsonObject | null;
}
