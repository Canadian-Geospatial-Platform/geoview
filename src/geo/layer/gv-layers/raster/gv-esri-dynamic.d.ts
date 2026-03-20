import type { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import type { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type { TypeFeatureInfoResult, TypeFeatureInfoEntryPartial } from '@/api/types/map-schema-types';
import type { TypeLayerMetadataEsriExtent } from '@/api/types/layer-schema-types';
import type { GeometryJson } from '@/geo/layer/gv-layers/utils';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
/**
 * Manages an Esri Dynamic layer.
 */
export declare class GVEsriDynamic extends AbstractGVRaster {
    #private;
    /** The default hit tolerance the query should be using */
    static DEFAULT_HIT_TOLERANCE: number;
    /**
     * Constructs a GVEsriDynamic layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: ImageArcGISRest, layerConfig: EsriDynamicLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): ImageLayer<ImageArcGISRest>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     *
     * @returns The ImageArcGISRest source instance associated with this layer.
     */
    getOLSource(): ImageArcGISRest;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): EsriDynamicLayerEntryConfig;
    /**
     * Overrides the fetching of the legend for an Esri Dynamic layer.
     *
     * @returns A promise that resolves with the legend of the layer or null
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides when the style should be set by the fetched legend.
     *
     * @param legend - The legend type
     */
    onSetStyleAccordingToLegend(legend: TypeLegend): void;
    /**
     * Overrides the way to get the bounds for this layer type.
     *
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise that resolves with the layer bounding box or undefined when not found
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Sends a query to get ESRI Dynamic feature geometries and calculates an extent from them.
     *
     * @param objectIds - The IDs of the features to calculate the extent from.
     * @param outProjection - The output projection for the extent.
     * @param outfield - Optional ID field to return for services that require a value in outfields.
     * @returns A promise that resolves with the extent of the features
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {ResponseTypeError} When the response from the service is not an object.
     * @throws {ResponseContentError} When the response actually contains an error within it.
     * @throws {NetworkError} When a network issue happened.
     */
    onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Overrides the hit tolerance of the layer.
     *
     * @returns The hit tolerance for a GV Esri Dynamic layer
     */
    getHitTolerance(): number;
    /**
     * Overrides the get all feature information for all the features stored in the layer.
     *
     * @param map - The Map so that we can grab the resolution/projection we want to get features on.
     * @param layerFilters - The layer filters to apply when querying the features.
     * @param abortController - Optional {@link AbortController} to cancel the operation.
     * @returns A promise that resolves with the feature info result
     */
    protected getAllFeatureInfo(map: OLMap, layerFilters: LayerFilters, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at a given coordinate.
     *
     * @param map - The Map where to get Feature Info At Coordinate from.
     * @param location - The coordinate that will be used by the query.
     * @param queryGeometry - Whether to include geometry in the query, default is true.
     * @param abortController - Optional {@link AbortController} to cancel the operation.
     * @returns A promise that resolves with the feature info result
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     *
     * @param map - The Map where to get Feature Info At LonLat from.
     * @param lonlat - The coordinate that will be used by the query.
     * @param queryGeometry - Whether to include geometry in the query, default is true.
     * @param abortController - Optional {@link AbortController} to cancel the operation.
     * @returns A promise that resolves with the feature info result
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the way an EsriDynamic layer applies a view filter. It does so by updating the source layerDefs parameter.
     *
     * @param filter - The raw filter string input (defaults to an empty string if not provided).
     */
    protected onSetLayerFilters(filter?: LayerFilters): void;
    /**
     * Retrieves feature records from the layer using their Object IDs (OIDs).
     *
     * This method queries the underlying layer for the specified object IDs and returns
     * a Promise resolving to an array of partial feature info entries.
     * The method automatically determines the geometry type and output fields from
     * the layer configuration. If an output spatial reference (`outSR`) is provided,
     * the geometries are projected accordingly.
     *
     * @param objectIDs - An array of Object IDs to query.
     * @param outSR - Optional output spatial reference (WKID) for geometry projection.
     * @returns A promise that resolves with an array of partial feature info entries
     */
    getRecordsByOIDs(objectIDs: number[], outSR?: number | undefined): Promise<TypeFeatureInfoEntryPartial[]>;
    /**
     * Applies a view filter to an Esri Dynamic layer's source by updating the `layerDefs` parameter.
     *
     * This function is responsible for generating the appropriate filter expression based on the layer configuration,
     * optional style, and time-based fragments. It ensures the filter is only applied if it has changed or needs to be reset.
     *
     * @param layerConfig - The configuration object for the Esri Dynamic layer.
     * @param source - The OpenLayers `ImageArcGISRest` source instance to which the filter will be applied.
     * @param filter - The raw filter string input (defaults to an empty string if not provided).
     * @throws {LayerInvalidLayerFilterError} When the filter expression fails to parse or cannot be applied.
     */
    static applyViewFilterOnSource(layerConfig: EsriDynamicLayerEntryConfig, source: ImageArcGISRest, filter: LayerFilters | undefined): void;
}
export type EsriQueryJsonResponse = {
    extent: TypeLayerMetadataEsriExtent;
};
export type EsriFeaturesJsonResponse = {
    features: EsriIdentifyJsonResponseAttribute[];
};
export type EsriIdentifyJsonResponse = {
    results: EsriIdentifyJsonResponseAttribute[];
};
export type EsriIdentifyJsonResponseAttribute = {
    attributes: Record<string, unknown>;
    geometry: GeometryJson;
};
//# sourceMappingURL=gv-esri-dynamic.d.ts.map