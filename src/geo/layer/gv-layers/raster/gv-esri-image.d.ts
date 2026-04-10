import type { ImageArcGISRest } from 'ol/source';
import type { Coordinate } from 'ol/coordinate';
import { Image as ImageLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import { Feature } from 'ol';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { TypeFeatureInfoEntry, TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import type { TypeMetadataEsriRasterFunctionInfos, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TemporalMode } from '@/core/utils/date-mgt';
import type { GeometryJson } from '@/geo/layer/gv-layers/utils';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
/**
 * Manages an Esri Image layer.
 */
export declare class GVEsriImage extends AbstractGVRaster {
    #private;
    /**
     * Constructs a GVEsriImage layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: ImageArcGISRest, layerConfig: EsriImageLayerEntryConfig);
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
    getLayerConfig(): EsriImageLayerEntryConfig;
    /**
     * Overrides the fetching of the legend for an Esri image layer.
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
     * Overrides the way a WMS layer applies a view filter. It does so by updating the source TIME parameters.
     *
     * @param filter - An optional filter to be used in place of the getViewFilter value.
     */
    protected onSetLayerFilters(filter?: LayerFilters): void;
    /**
     * Overrides the return of feature information at a given coordinate.
     *
     * @param map - The Map where to get Feature Info At Coordinate from.
     * @param location - The coordinate that will be used by the query.
     * @param queryGeometry - Whether to include geometry in the query, default is true.
     * @returns A promise that resolves with the feature info result
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     *
     * @param map - The Map where to get Feature Info At LonLat from.
     * @param lonlat - The coordinate that will be used by the query.
     * @param queryGeometry - Optional, whether to include geometry in the query, default is true.
     * @returns A promise that resolves with the feature info result
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the formatting of feature info results to skip icon rendering for pixel-based queries.
     *
     * ESRI Image layers return pixel values, not symbolized features, so we skip the icon source step.
     *
     * @param features - The array of features to format
     * @param layerConfig - The layer configuration
     * @param serviceDateFormat - Optional date format used by the service
     * @param serviceDateIANA - Optional IANA time zone identifier used by the service
     * @param serviceDateTemporalMode - Optional temporal mode for date handling
     * @returns The formatted feature info entries
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: EsriImageLayerEntryConfig, serviceDateFormat: string | undefined, serviceDateIANA: string | undefined, serviceDateTemporalMode: TemporalMode | undefined): TypeFeatureInfoEntry[];
    /**
     * Gets the list of rasterFunctionInfos that are available in the ImageServer
     *
     * @returns The ImageServer's rasterFunctionInfos or undefined when not available
     */
    getMetadataRasterFunctionInfos(): TypeMetadataEsriRasterFunctionInfos[] | undefined;
    /**
     * Gets the currently active raster function identifier.
     *
     * @returns The raster function identifier or undefined when not set
     */
    getRasterFunction(): string | undefined;
    /**
     * Updates the raster function for the layer
     *
     * @param rasterFunctionId - The raster function ID to apply
     */
    setRasterFunction(rasterFunctionId: string | undefined): void;
    /**
     * Gets individual preview promises for each raster function
     *
     * @param size - The size of the preview image (width and height)
     * @returns A map of raster function names to their preview image promises
     */
    getRasterFunctionPreviews(size?: number): Map<string, Promise<string>>;
    /**
     * Gets the current mosaic rule for the layer.
     *
     * @returns The current mosaic rule or undefined when not set
     */
    getMosaicRule(): TypeMosaicRule | undefined;
    /**
     * Sets the entire mosaicRule object and updates the OL source.
     *
     * @param mosaicRule - The new mosaicRule object
     */
    setMosaicRule(mosaicRule: TypeMosaicRule | undefined): void;
}
export type TypeEsriImageLayerLegend = {
    layers: TypeEsriImageLayerLegendLayer[];
};
export type TypeEsriImageLayerLegendLayer = {
    layerId: number | string;
    layerName: string;
    layerType: string;
    minScale: number;
    maxScale: number;
    legendType: string;
    legend: TypeEsriImageLayerLegendLayerLegend[];
};
export type TypeEsriImageLayerLegendLayerLegend = {
    label: string;
    url: string;
    imageData: string;
    contentType: string;
    height: number;
    width: number;
    values: string[];
};
export type EsriImageIdentifyJsonResponse = {
    objectId: number;
    name: string;
    value: string | number;
    location?: {
        x: number;
        y: number;
        spatialReference: {
            wkid: number;
            latestWkid?: number;
        };
    };
    properties?: {
        Values: string[];
    };
    catalogItems?: {
        objectIdFieldName: string;
        geometryType: string;
        spatialReference: {
            wkid: number;
            latestWkid?: number;
        };
        features: Array<{
            attributes: Record<string, unknown>;
            geometry?: GeometryJson;
        }>;
    };
    processedValues?: string[];
};
//# sourceMappingURL=gv-esri-image.d.ts.map