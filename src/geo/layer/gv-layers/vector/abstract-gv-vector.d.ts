import type { Map as OLMap, Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Pixel } from 'ol/pixel';
import type { Projection as OLProjection } from 'ol/proj';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeFeatureInfoResult, TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import type { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVVectorSource } from '@/geo/layer/source/vector-source';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export declare abstract class AbstractGVVector extends AbstractGVLayer {
    #private;
    /** Indicates if the style has been applied on the layer yet */
    styleApplied: boolean;
    /** Maximum number of styles to cache */
    static readonly STYLE_CACHE_SIZE_LIMIT = 1000;
    /**
     * Constructs a GeoView Vector layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    protected constructor(olSource: VectorSource<Feature<Geometry>>, layerConfig: VectorLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): VectorLayer<VectorSource>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     *
     * @returns The VectorSource source instance associated with this layer.
     */
    getOLSource(): GVVectorSource;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): VectorLayerEntryConfig;
    /**
     * Sets the visibility of the layer.
     *
     * @param layerVisibility - The visibility state to set.
     */
    protected onSetVisible(layerVisibility: boolean): void;
    /**
     * Sets the opacity of the layer.
     *
     * @param opacity - The opacity value to set.
     * @param emitOpacityChanged - Whether to emit the opacity changed event.
     */
    protected onSetOpacity(opacity: number, emitOpacityChanged?: boolean): void;
    /**
     * Sets the z-index of the layer.
     *
     * @param zIndex - The z-index value to set.
     * @param emitZIndexChanged - Whether to emit the z-index changed event.
     */
    protected onSetZIndex(zIndex: number, emitZIndexChanged?: boolean): void;
    /**
     * Overridable method called to get a more specific error code for all errors.
     *
     * @param event - The event which is being triggered.
     * @returns The GeoViewError stored in the GVVectorSource if any or the one from the parent method.
     */
    protected onErrorDecipherError(event: Event): GeoViewError;
    /**
     * Overrides the get all feature information for all the features stored in the layer.
     *
     * @param map - The Map so that we can grab the resolution/projection we want to get features on.
     * @param layerFilters - The layer filters to apply when querying the features.
     * @param abortController - Optional {@link AbortController} to cancel the request.
     * @returns A promise that resolves with the feature info result.
     */
    protected getAllFeatureInfo(map: OLMap, layerFilters: LayerFilters, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at a given pixel location.
     *
     * @param map - The Map where to get Feature Info At Pixel from.
     * @param location - The pixel coordinate that will be used by the query.
     * @returns A promise that resolves with the feature info result.
     */
    protected getFeatureInfoAtPixel(map: OLMap, location: Pixel): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at a given coordinate.
     *
     * @param map - The Map where to get Feature Info At Coordinate from.
     * @param location - The coordinate that will be used by the query.
     * @param queryGeometry - Whether to include geometry in the query, default is true.
     * @param abortController - Optional {@link AbortController} to cancel the request.
     * @returns A promise that resolves with the feature info result.
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     *
     * @param map - The Map where to get Feature Info At LonLat from.
     * @param lonlat - The coordinate that will be used by the query.
     * @param queryGeometry - Whether to include geometry in the query, default is true.
     * @param abortController - Optional {@link AbortController} to cancel the request.
     * @returns A promise that resolves with the feature info result.
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the way to get the bounds for this layer type.
     *
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise that resolves with the layer bounding box, or undefined if not available.
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Gets the extent of an array of features.
     *
     * @param objectIds - The uids of the features to calculate the extent from.
     * @param outProjection - The output projection for the extent.
     * @param outfield - Optional ID field to return for services that require a value in outfields.
     * @returns A promise that resolves with the extent of the features.
     */
    onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Sets the layer style.
     *
     * @param style - The layer style
     */
    setStyle(style: TypeLayerStyleConfig): void;
    /**
     * Sets the style applied flag indicating when a style has been applied for the AbstractGVVector via the style callback function.
     *
     * @param styleApplied - Indicates if the style has been applied on the AbstractGVVector.
     */
    setStyleApplied(styleApplied: boolean): void;
    /**
     * Gets the OpenLayers text layer if one exists.
     *
     * @returns The text layer or undefined if no text layer exists.
     */
    getTextOLLayer(): VectorLayer<VectorSource> | undefined;
    /**
     * Gets the independent visibility state of the text layer.
     *
     * @returns True if text layer is set to visible independently.
     */
    getTextVisible(): boolean;
    /**
     * Sets the independent visibility of the text layer.
     * The text layer's actual visibility is: layerVisible && textVisible
     *
     * @param visible - Whether text should be visible independently.
     */
    setTextVisible(visible: boolean): void;
    /**
     * Gets the actual visibility state of the text layer on the map.
     * This considers both layer visibility and independent text visibility.
     *
     * @returns True if the text layer is currently visible on the map.
     */
    getTextLayerVisible(): boolean;
    /**
     * Registers a style applied event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onStyleApplied(callback: StyleAppliedDelegate): void;
    /**
     * Unregisters a style applied event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offStyleApplied(callback: StyleAppliedDelegate): void;
    /**
     * Registers a text visible changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onTextVisibleChanged(callback: TextVisibleChangedDelegate): void;
    /**
     * Unregisters a text visible changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offTextVisibleChanged(callback: TextVisibleChangedDelegate): void;
    /**
     * Calculates a style for the given feature, based on the layer current style and options.
     *
     * @param layer - The layer on which to work for the style.
     * @param feature - Feature that need its style to be defined.
     * @param label - The style label when one has to be created
     * @param filterEquation - Filter equation associated to the layer.
     * @returns The style for the feature or undefined if no style could be calculated.
     */
    static calculateStyleForFeature(layer: AbstractGVLayer, feature: FeatureLike, resolution: number, label: string, filterEquation?: FilterNodeType[]): Style | undefined;
    /**
     * Calculates a text-only style (no geometry) for the given feature.
     *
     * @param layer - The layer on which to work for the style.
     * @param feature - Feature that needs its style defined.
     * @param resolution - The map resolution.
     * @returns The text-only style or undefined if no text style could be calculated.
     */
    static calculateTextStyleForFeature(layer: AbstractGVLayer, feature: FeatureLike, resolution: number): Style | undefined;
}
/**
 * Define an event for the delegate
 */
export type StyleAppliedEvent = {
    styleApplied: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
export type StyleAppliedDelegate = EventDelegateBase<AbstractGVVector, StyleAppliedEvent, void>;
/**
 * Define an event for the delegate
 */
export type TextVisibleChangedEvent = {
    textVisible: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
export type TextVisibleChangedDelegate = EventDelegateBase<AbstractGVVector, TextVisibleChangedEvent, void>;
//# sourceMappingURL=abstract-gv-vector.d.ts.map