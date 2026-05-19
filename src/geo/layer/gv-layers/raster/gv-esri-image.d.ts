import type { ImageArcGISRest } from 'ol/source';
import type { Coordinate } from 'ol/coordinate';
import { Image as ImageLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import { Feature } from 'ol';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { TypeDisplayLanguage, TypeFeatureInfoEntry, TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import type { TypeLegend, TypeMetadataEsriRasterFunctionInfos, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { TemporalMode } from '@/core/utils/date-mgt';
import type { GeometryJson } from '@/geo/layer/gv-layers/utils';
import type { LayerBaseEvent } from '@/geo/layer/gv-layers/abstract-base-layer';
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
     * @param map - The Map where to get Feature Info At Coordinate from
     * @param location - The coordinate that will be used by the query
     * @param queryGeometry - Whether to include geometry in the query, default is true
     * @param language - The display language, used to guess the best name field for the 'nameField'
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry: boolean | undefined, language: TypeDisplayLanguage, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     *
     * @param map - The Map where to get Feature Info At LonLat from
     * @param lonlat - The coordinate that will be used by the query
     * @param queryGeometry - Whether to include geometry in the query, default is true
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry: boolean | undefined, language: TypeDisplayLanguage, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
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
    protected formatFeatureInfoResult(features: Feature[], layerConfig: EsriImageLayerEntryConfig, language: TypeDisplayLanguage, serviceDateFormat: string | undefined, serviceDateIANA: string | undefined, serviceDateTemporalMode: TemporalMode | undefined): TypeFeatureInfoEntry[];
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
    /**
     * Registers a raster function changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback, which can be used to unregister the event handler later
     */
    onRasterFunctionChanged(callback: RasterFunctionChangedDelegate): RasterFunctionChangedDelegate;
    /**
     * Unregisters a raster function changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offRasterFunctionChanged(callback: RasterFunctionChangedDelegate | undefined): void;
    /**
     * Registers a mosaic rule changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback, which can be used to unregister the event handler later
     */
    onMosaicRuleChanged(callback: MosaicRuleChangedDelegate): MosaicRuleChangedDelegate;
    /**
     * Unregisters a mosaic rule changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offMosaicRuleChanged(callback: MosaicRuleChangedDelegate | undefined): void;
}
/** Legend structure returned by the ESRI Image layer legend endpoint. */
export type TypeEsriImageLayerLegend = {
    layers: TypeEsriImageLayerLegendLayer[];
};
/** A single layer entry within an ESRI image legend response. */
export type TypeEsriImageLayerLegendLayer = {
    layerId: number | string;
    layerName: string;
    layerType: string;
    minScale: number;
    maxScale: number;
    legendType: string;
    legend: TypeEsriImageLayerLegendLayerLegend[];
};
/** A single legend entry (symbol) within an ESRI image legend layer. */
export type TypeEsriImageLayerLegendLayerLegend = {
    label: string;
    url: string;
    imageData: string;
    contentType: string;
    height: number;
    width: number;
    values: string[];
};
/** JSON response from the ESRI Image identify operation. */
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
/**
 * Define an event for the delegate.
 */
export interface RasterFunctionChangedEvent extends LayerBaseEvent {
    /** The raster function identifier, or undefined when removed. */
    functionId: string | undefined;
}
/**
 * Define a delegate for the event handler function signature
 */
export type RasterFunctionChangedDelegate = EventDelegateBase<GVEsriImage, RasterFunctionChangedEvent, void>;
/**
 * Define an event for the delegate.
 */
export interface MosaicRuleChangedEvent extends LayerBaseEvent {
    /** The mosaic rule, or undefined when removed. */
    mosaicRule: TypeMosaicRule | undefined;
}
/**
 * Define a delegate for the event handler function signature.
 */
export type MosaicRuleChangedDelegate = EventDelegateBase<GVEsriImage, MosaicRuleChangedEvent, void>;
//# sourceMappingURL=gv-esri-image.d.ts.map