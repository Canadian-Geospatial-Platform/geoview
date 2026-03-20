import type { Projection as OLProjection } from 'ol/proj';
import { ImageArcGISRest } from 'ol/source';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type { TypeGeoviewLayerConfig, TypeMetadataEsriDynamic } from '@/api/types/layer-schema-types';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { DisplayDateMode } from '@/api/types/map-schema-types';
export interface TypeEsriDynamicLayerConfig extends TypeGeoviewLayerConfig {
    geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
    listOfLayerEntryConfig: (GroupLayerEntryConfig | EsriDynamicLayerEntryConfig)[];
}
/**
 * A class to add an EsriDynamic layer.
 */
export declare class EsriDynamic extends AbstractGeoViewRaster {
    #private;
    static DEFAULT_HIT_TOLERANCE: number;
    hitTolerance: number;
    /**
     * Constructs an EsriDynamic Layer configuration processor.
     *
     * @param layerConfig - The layer configuration.
     */
    constructor(layerConfig: TypeEsriDynamicLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeEsriDynamicLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataEsriDynamic | undefined;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     *
     * @returns A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the way the validation of the list of layer entry config happens.
     *
     * @param listOfLayerEntryConfig - The list of layer entries configuration to validate.
     */
    protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void;
    /**
     * Overrides the way the layer metadata is processed.
     *
     * @param layerConfig - The layer entry configuration to process.
     * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata.
     * @param mapProjection - Optional map projection.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @returns A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: EsriDynamicLayerEntryConfig, displayDateMode: DisplayDateMode, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<EsriDynamicLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     *
     * @param layerConfig - The layer entry configuration.
     * @returns The GV Layer
     */
    protected onCreateGVLayer(layerConfig: EsriDynamicLayerEntryConfig): GVEsriDynamic;
    /**
     * Initializes a GeoView layer configuration for an Esri Dynamic layer.
     *
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     *
     * @param geoviewLayerId - A unique identifier for the layer.
     * @param geoviewLayerName - The display name of the layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a Esri Dynamic layer.
     *
     * This function constructs a `TypeEsriDynamicLayerConfig` object that describes an Esri Dynamic layer
     * and its associated entry configurations based on the provided parameters.
     *
     * @param geoviewLayerId - A unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name of the GeoView layer.
     * @param metadataAccessPath - The URL or path to access metadata.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param layerEntries - An array of layer entries objects to be included in the configuration.
     * @param customGeocoreLayerConfig - An optional layer config from Geocore.
     * @returns The constructed configuration object for the Esri Dynamic layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[], customGeocoreLayerConfig?: unknown): TypeEsriDynamicLayerConfig;
    /**
     * Processes an Esri Dynamic GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     *
     * @param geoviewLayerId - The unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name for the GeoView layer.
     * @param url - The URL of the service endpoint.
     * @param layerIds - An array of layer IDs to include in the configuration.
     * @param isTimeAware - Indicates if the layer is time aware.
     * @returns A promise that resolves to an array of layer configurations.
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: number[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
    /**
     * Creates an ImageArcGISRest source from a layer config.
     *
     * @param layerConfig - The configuration for the EsriDynamic layer.
     * @returns A fully configured ImageArcGISRest source.
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     */
    static createEsriDynamicSource(layerConfig: EsriDynamicLayerEntryConfig): ImageArcGISRest;
    /**
     * Builds a hierarchical tree structure from a flat array of ESRI layer entries by linking parent layers
     * with their corresponding sublayers based on `subLayerIds`.
     *
     * @remarks
     * - Each entry is deep-cloned to avoid mutating the original input.
     * - Entries that are referenced as sublayers are nested under their parent in the `subLayers` array.
     * - Only root-level entries (those not referenced as sublayers) are returned at the top level of the tree.
     *
     * @param entries - A flat array of layer entry objects, each potentially referencing sublayers by ID.
     * @returns A nested array representing the hierarchical layer structure with `subLayers` assigned to parents.
     */
    static buildLayerEntriesTree(entries: {
        layerId: number;
        subLayerIds: number[] | null;
    }[]): TypeLayerEntryShell[];
}
//# sourceMappingURL=esri-dynamic.d.ts.map