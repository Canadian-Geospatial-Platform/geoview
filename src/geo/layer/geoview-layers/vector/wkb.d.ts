import type { Feature } from 'ol';
import type { ReadOptions } from 'ol/format/Feature';
import type { Options as SourceOptions } from 'ol/source/Vector';
import type { Projection as OLProjection } from 'ol/proj';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import type { TypeGeoviewLayerConfig, TypeMetadataGeoJSON } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVWKB } from '@/geo/layer/gv-layers/vector/gv-wkb';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export interface TypeWkbLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WKB;
    listOfLayerEntryConfig: WkbLayerEntryConfig[];
}
/**
 * Class used to add WKB layer to the map
 *
 * @exports
 * @class WKB
 */
export declare class WKB extends AbstractGeoViewVector {
    #private;
    /**
     * Constructs a WKB Layer configuration processor.
     * @param {TypeWkbLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeWkbLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataGeoJSON | undefined} The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataGeoJSON | undefined;
    /**
     * Overrides the way the metadata is fetched.
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<T = TypeMetadataGeoJSON | undefined>} A promise with the metadata or undefined when no metadata for the particular layer type.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     */
    protected onFetchServiceMetadata<T = TypeMetadataGeoJSON | undefined>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the validation of a layer entry config.
     * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {VectorLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {OLProjection?} [mapProjection] - The map projection.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<VectorLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: VectorLayerEntryConfig, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<VectorLayerEntryConfig>;
    /**
     * Overrides the loading of the vector features for the layer by reading WKB data and converting it
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
     * @protected
     * @override
     */
    protected onCreateVectorSourceLoadFeatures(layerConfig: VectorLayerEntryConfig, sourceOptions: SourceOptions<Feature>, readOptions: ReadOptions): Promise<Feature[]>;
    /**
     * Overrides the creation of the GV Layer
     * @param {WkbLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVWKB} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: WkbLayerEntryConfig): GVWKB;
    /**
     * Fetches the metadata for a typical GeoJson class.
     * @param {string} url - The url to query the metadata from.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @static
     */
    static fetchMetadata(url: string, abortSignal?: AbortSignal): Promise<TypeMetadataGeoJSON>;
    /**
     * Initializes a GeoView layer configuration for a WKB layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     * @static
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a WKB Feature layer.
     * This function constructs a `TypeWkbLayerConfig` object that describes an WKB Feature layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata or feature data.
     * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeWkbLayerConfig} The constructed configuration object for the WKB Feature layer.
     * @static
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[]): TypeWkbLayerConfig;
    /**
     * Processes a WKB GeoviewLayerConfig and returns a promise
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
//# sourceMappingURL=wkb.d.ts.map