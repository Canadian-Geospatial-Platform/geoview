import { ImageArcGISRest } from 'ol/source';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type { TypeGeoviewLayerConfig, TypeMetadataEsriDynamic } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export interface TypeEsriDynamicLayerConfig extends TypeGeoviewLayerConfig {
    geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
    listOfLayerEntryConfig: (GroupLayerEntryConfig | EsriDynamicLayerEntryConfig)[];
}
/**
 * A class to add an EsriDynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
export declare class EsriDynamic extends AbstractGeoViewRaster {
    #private;
    static DEFAULT_HIT_TOLERANCE: number;
    hitTolerance: number;
    /**
     * Constructs an EsriDynamic Layer configuration processor.
     * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
     */
    constructor(layerConfig: TypeEsriDynamicLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataEsriDynamic | undefined} The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataEsriDynamic | undefined;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the way the validation of the list of layer entry config happens.
     * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<EsriDynamicLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: EsriDynamicLayerEntryConfig, abortSignal?: AbortSignal): Promise<EsriDynamicLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVEsriDynamic} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: EsriDynamicLayerEntryConfig): GVEsriDynamic;
    /**
     * Performs specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
     * @param {ConfigBaseClass} layerConfig - The layer config to check.
     * @returns {boolean} true if an error is detected.
     */
    esriChildHasDetectedAnError(layerConfig: ConfigBaseClass): boolean;
    /**
     * Initializes a GeoView layer configuration for an Esri Dynamic layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a Esri Dynamic layer.
     * This function constructs a `TypeEsriDynamicLayerConfig` object that describes an Esri Dynamic layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @param {unknown} customGeocoreLayerConfig - An optional layer config from Geocore.
     * @returns {TypeEsriDynamicLayerConfig} The constructed configuration object for the Esri Dynamic layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeLayerEntryShell[], customGeocoreLayerConfig?: unknown): TypeEsriDynamicLayerConfig;
    /**
     * Processes an Esri Dynamic GeoviewLayerConfig and returns a promise
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
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: number[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
    /**
     * Creates an ImageArcGISRest source from a layer config.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The configuration for the EsriDynamic layer.
     * @returns {ImageArcGISRest} A fully configured ImageArcGISRest source.
     * @throws If required config fields like dataAccessPath are missing.
     */
    static createEsriDynamicSource(layerConfig: EsriDynamicLayerEntryConfig): ImageArcGISRest;
    /**
     * Builds a hierarchical tree structure from a flat array of ESRI layer entries by linking parent layers
     * with their corresponding sublayers based on `subLayerIds`.
     * @remarks
     * - Each entry is deep-cloned to avoid mutating the original input.
     * - Entries that are referenced as sublayers are nested under their parent in the `subLayers` array.
     * - Only root-level entries (those not referenced as sublayers) are returned at the top level of the tree.
     * @param {{ layerId: number; subLayerIds: number[] }[]} entries - A flat array of layer entry objects, each potentially referencing sublayers by ID.
     * @returns {TypeLayerEntryShell[]} A nested array representing the hierarchical layer structure with `subLayers` assigned to parents.
     */
    static buildLayerEntriesTree(entries: {
        layerId: number;
        subLayerIds: number[];
    }[]): TypeLayerEntryShell[];
}
//# sourceMappingURL=esri-dynamic.d.ts.map