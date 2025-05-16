import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/esri-group-layer-config';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoviewEsriLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-esri-layer-config';
import { EsriFeatureLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/vector/esri-feature-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
export type TypeEsriFeatureLayerNode = EsriGroupLayerConfig | EsriFeatureLayerEntryConfig;
/**
 * The ESRI feature geoview layer class.
 */
export declare class EsriFeatureLayerConfig extends AbstractGeoviewEsriLayerConfig {
    /** Type of GeoView layer. */
    geoviewLayerType: import("../../../map-schema-types").TypeGeoviewLayerType;
    /** The layer entries to use from the GeoView layer. */
    listOfLayerEntryConfig: TypeEsriFeatureLayerNode[];
    /**
     * @protected @override
     * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
     * section of the schema must be used to do its validation.
     *
     * @returns {string} The GeoView layer schema associated to the config.
     */
    protected getGeoviewLayerSchema(): string;
    /**
     * @override
     * The method used to implement the class factory model that returns the instance of the class based on the leaf
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The leaf node configuration.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
     */
    createLeafNode(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass;
    /**
     * @override
     * The method used to implement the class factory model that returns the instance of the class based on the group
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The group node configuration.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
     */
    createGroupNode(layerConfig: TypeJsonObject, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass;
}
