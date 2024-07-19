import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriFeatureLayerEntryConfig } from '@config/types/classes/sub-layer-config/vector-leaf/esri-feature-layer-entry-config';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { AbstractGeoviewEsriLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-esri-layer-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';
export type TypeEsriFeatureLayerNode = GroupLayerEntryConfig | EsriFeatureLayerEntryConfig;
/** The ESRI feature geoview layer class. */
export declare class EsriFeatureLayerConfig extends AbstractGeoviewEsriLayerConfig {
    /** Type of GeoView layer. */
    geoviewLayerType: import("@config/types/map-schema-types").TypeGeoviewLayerType;
    /** The layer entries to use from the GeoView layer. */
    listOfLayerEntryConfig: TypeEsriFeatureLayerNode[];
    /**
     * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
     * section of the schema must be used to do its validation.
     *
     * @returns {string} The GeoView layer schema associated to the config.
     * @protected
     */
    protected get geoviewLayerSchema(): string;
    /**
     * The method used to implement the class factory model that returns the instance of the class based on the sublayer
     * type needed.
     *
     * @param {TypeJsonObject} layerConfig The lsub ayer configuration.
     * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
     * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
     * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
     *
     * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
     */
    createLeafNode(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, geoviewConfig: AbstractGeoviewLayerConfig, parentNode?: EntryConfigBaseClass): EntryConfigBaseClass;
}
