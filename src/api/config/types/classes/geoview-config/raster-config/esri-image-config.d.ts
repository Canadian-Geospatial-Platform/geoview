import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/esri-group-layer-config';
import { TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { AbstractGeoviewEsriLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-esri-layer-config';
import { EsriImageLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/raster/esri-image-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
export type TypeEsriImageLayerNode = EsriGroupLayerConfig | EsriImageLayerEntryConfig;
/**
 * The ESRI Image geoview layer class.
 */
export declare class EsriImageLayerConfig extends AbstractGeoviewEsriLayerConfig {
    /** Type of GeoView layer. */
    geoviewLayerType: import("@config/types/map-schema-types").TypeGeoviewLayerType;
    /** The layer entries to use from the GeoView layer. */
    listOfLayerEntryConfig: TypeEsriImageLayerNode[];
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
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
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
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
     * @override
     */
    createGroupNode(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass;
}
