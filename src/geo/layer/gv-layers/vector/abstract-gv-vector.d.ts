import { Map as OLMap, Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { Projection as OLProjection } from 'ol/proj';
import { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { TypeDateFragments } from '@/core/utils/date-mgt';
/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export declare abstract class AbstractGVVector extends AbstractGVLayer {
    /**
     * Constructs a GeoView Vector layer to manage an OpenLayer layer.
     * @param {VectorSource<Feature<Geometry>>} olSource - The OpenLayer source.
     * @param {VectorLayerEntryConfig} layerConfig - The layer configuration.
     */
    protected constructor(olSource: VectorSource<Feature<Geometry>>, layerConfig: VectorLayerEntryConfig);
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {VectorLayer<Feature>} The OpenLayers Layer
     */
    getOLLayer(): VectorLayer<VectorSource>;
    /**
     * Overrides the get of the OpenLayers Layer Source
     * @returns {VectorSource} The OpenLayers Layer Source
     */
    getOLSource(): VectorSource;
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {VectorLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): VectorLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected getFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Overrides the get all feature information for all the features stored in the layer.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getAllFeatureInfo(abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at a given pixel location.
     * @param {OLMap} map - The Map where to get Feature Info At Pixel from.
     * @param {Pixel} location - The pixel coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtPixel(map: OLMap, location: Pixel): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At LongLat from.
     * @param {Coordinate} lnglat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLongLat(map: OLMap, lnglat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Applies a view filter to a Vector layer's configuration by updating the layerConfig.filterEquation parameter.
     * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
     */
    applyViewFilter(filter?: string | undefined): void;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
    /**
     * Gets the extent of an array of features.
     * @param {string[]} objectIds - The uids of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string?} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available.
     */
    getExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Calculates a style for the given feature, based on the layer current style and options.
     * @param {AbstractGVLayer} layer - The layer on which to work for the style.
     * @param {FeatureLike} feature - Feature that need its style to be defined.
     * @param {string} label - The style label when one has to be created
     * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
     * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
     * @returns {Style} The style for the feature
     */
    static calculateStyleForFeature(layer: AbstractGVLayer, feature: FeatureLike, label: string, filterEquation?: FilterNodeType[], legendFilterIsOff?: boolean): Style | undefined;
    /**
     * Applies a view filter to a vector layer configuration. The resulting filter is parsed and stored in the layer
     * config's `filterEquation`, and triggers a re-evaluation of feature styles if applicable.
     * If the layer config is invalid or the filter has not changed, no action is taken. Date values in the filter are also
     * parsed using external fragments if available.
     * @param {VectorLayerEntryConfig} layerConfig - The vector layer configuration to apply the filter to.
     * @param {TypeDateFragments | undefined} externalDateFragments - Optional date fragments used to parse time-based filters.
     * @param {AbstractGVLayer | undefined} layer - Optional GeoView layer containing that will get its source updated to trigger a redraw.
     * @param {string | undefined} filter - A raw filter string to override the layer's view filter (default is an empty string).
     * @param {(filterToUse: string) => void} [callbackWhenUpdated] - Optional callback invoked with the final filter string if updated.
     * @throws {LayerInvalidLayerFilterError} If the filter cannot be parsed or applied due to a syntax or runtime issue.
     */
    static applyViewFilterOnConfig(layerConfig: VectorLayerEntryConfig, externalDateFragments: TypeDateFragments | undefined, layer: AbstractGVLayer | undefined, filter?: string | undefined, callbackWhenUpdated?: ((filterToUse: string) => void) | undefined): void;
}
