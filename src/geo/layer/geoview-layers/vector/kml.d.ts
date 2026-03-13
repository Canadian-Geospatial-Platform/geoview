import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { KmlLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVKML } from '@/geo/layer/gv-layers/vector/gv-kml';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import type { DisplayDateMode } from '@/api/types/map-schema-types';
export interface TypeKmlLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.KML;
    listOfLayerEntryConfig: KmlLayerEntryConfig[];
}
/**
 * Class used to add KML layer to the map
 * @exports
 * @class KML
 */
export declare class KML extends AbstractGeoViewVector {
    /**
     * Constructs a KML Layer configuration processor.
     *
     * @param layerConfig - The layer configuration
     */
    constructor(layerConfig: TypeKmlLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeKmlLayerConfig;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @returns A promise resolved once the layer entries have been initialized.
     * @override
     * @protected
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {DisplayDateMode} displayDateMode - The display date mode to use for processing time dimensions in the metadata.
     * @param {OLProjection?} [mapProjection] - The map projection.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     * @override
     * @protected
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig, displayDateMode: DisplayDateMode, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<VectorLayerEntryConfig>;
    /**
     * Overrides the loading of the vector features for the layer by fetching KML data and converting it
     * into OpenLayers {@link Feature} feature instances.
     * @param {VectorLayerEntryConfig} layerConfig -
     * The configuration object for the vector layer, containing source and
     * data access information.
     * @param {SourceOptions<Feature>} sourceOptions -
     * The OpenLayers vector source options associated with the layer. This may be
     * used by implementations to customize loading behavior or source configuration.
     * @param {ReadOptions} readOptions -
     * Options controlling how features are read, including the target
     * `featureProjection`.
     * @returns {Promise<Feature[]>}
     * A promise that resolves to an array of OpenLayers features.
     * @override
     * @protected
     */
    protected onCreateVectorSourceLoadFeatures(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): Promise<Feature[]>;
    /**
     * Overrides the creation of the GV Layer
     * @param {KmlLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVKML} The GV Layer
     * @override
     * @protected
     */
    protected onCreateGVLayer(layerConfig: KmlLayerEntryConfig): GVKML;
    /**
     * Initializes a GeoView layer configuration for a KML layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param geoviewLayerId - A unique identifier for the layer.
     * @param geoviewLayerName - The display name of the layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries.
     * @static
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a KML Feature layer.
     * This function constructs a `TypeKmlLayerConfig` object that describes an KML Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param geoviewLayerId - A unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name of the GeoView layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns The constructed configuration object for the KML Feature layer.
     * @static
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[]): TypeKmlLayerConfig;
    /**
     * Processes a KML GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name for the GeoView layer.
     * @param {string} url - The URL of the service endpoint.
     * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
     * @param {boolean} isTimeAware - Indicates if the layer is time aware.
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     * @static
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
}
//# sourceMappingURL=kml.d.ts.map