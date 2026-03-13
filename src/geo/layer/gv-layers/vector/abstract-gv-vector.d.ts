import type { Map as OLMap, Feature } from 'ol';
import type { FeatureLike } from 'ol/Feature';
import type { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type Style from 'ol/style/Style';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Pixel } from 'ol/pixel';
import type { Projection as OLProjection } from 'ol/proj';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeFeatureInfoResult, TypeOutfieldsType } from '@/api/types/map-schema-types';
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
     * @returns {VectorLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): VectorLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field or 'string' when undefined.
     * @override
     * @protected
     */
    protected onGetFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Overridable method called to get a more specific error code for all errors.
     * @param event - The event which is being triggered.
     * @returns The GeoViewError stored in the GVVectorSource if any or the one from the parent method.
     */
    protected onErrorDecipherError(event: Event): GeoViewError;
    /**
     * Overrides the get all feature information for all the features stored in the layer.
     * @param {OLMap} map - The Map so that we can grab the resolution/projection we want to get features on.
     * @param {LayerFilters} layerFilters - The layer filters to apply when querying the features.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     * @override
     * @protected
     */
    protected getAllFeatureInfo(map: OLMap, layerFilters: LayerFilters, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at a given pixel location.
     * @param {OLMap} map - The Map where to get Feature Info At Pixel from.
     * @param {Pixel} location - The pixel coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     * @override
     * @protected
     */
    protected getFeatureInfoAtPixel(map: OLMap, location: Pixel): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     * @override
     * @protected
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
     * @param {Coordinate} lonlat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     * @override
     * @protected
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise of layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Gets the extent of an array of features.
     * @param {number[] | string[]} objectIds - The uids of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string?} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available.
     * @override
     */
    onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Sets the style applied flag indicating when a style has been applied for the AbstractGVVector via the style callback function.
     * @param {boolean} styleApplied - Indicates if the style has been applied on the AbstractGVVector.
     */
    setStyleApplied(styleApplied: boolean): void;
    /**
     * Registers a style applied event handler.
     * @param {StyleAppliedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onStyleApplied(callback: StyleAppliedDelegate): void;
    /**
     * Unregisters a style applied event handler.
     * @param {StyleAppliedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offStyleApplied(callback: StyleAppliedDelegate): void;
    /**
     * Calculates a style for the given feature, based on the layer current style and options.
     * @param {AbstractGVLayer} layer - The layer on which to work for the style.
     * @param {FeatureLike} feature - Feature that need its style to be defined.
     * @param {string} label - The style label when one has to be created
     * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
     * @returns {Style} The style for the feature
     */
    static calculateStyleForFeature(layer: AbstractGVLayer, feature: FeatureLike, resolution: number, label: string, filterEquation?: FilterNodeType[]): Style | undefined;
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
//# sourceMappingURL=abstract-gv-vector.d.ts.map