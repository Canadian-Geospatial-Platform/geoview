import { Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { FilterNodeArrayType } from '@/geo/utils/renderer/geoview-renderer-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export declare abstract class AbstractGVVector extends AbstractGVLayer {
    /**
     * Constructs a GeoView Vector layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {VectorSource<Feature<Geometry>>} olSource - The OpenLayer source.
     * @param {VectorLayerEntryConfig} layerConfig - The layer configuration.
     */
    protected constructor(mapId: string, olSource: VectorSource<Feature<Geometry>>, layerConfig: VectorLayerEntryConfig);
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
     * @param {Pixel} location - The pixel coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtPixel(location: Pixel): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {Coordinate} lnglat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLongLat(lnglat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides when the layer gets in loaded status.
     */
    protected onLoaded(): void;
    /**
     * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     * @param {string} filter - A filter to be used in place of the getViewFilter value.
     * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
     */
    applyViewFilter(filter: string, combineLegendFilter?: boolean): void;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(): Extent | undefined;
    /**
     * Gets the extent of an array of features.
     * @param {string[]} objectIds - The uids of the features to calculate the extent from.
     * @returns {Promise<Extent | undefined>} The extent of the features, if available.
     */
    getExtentFromFeatures(objectIds: string[]): Promise<Extent | undefined>;
    /**
     * Return the vector layer as a GeoJSON object
     * @returns {JSON} Layer's features as GeoJSON
     */
    getFeaturesAsGeoJSON(): JSON;
    /**
     * Calculates a style for the given feature, based on the layer current style and options.
     * @param {AbstractGVLayer} layer - The layer on which to work for the style.
     * @param {FeatureLike} feature - Feature that need its style to be defined.
     * @param {string} label - The style label when one has to be created
     * @param {FilterNodeArrayType} filterEquation - Filter equation associated to the layer.
     * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
     * @returns {Style} The style for the feature
     */
    static calculateStyleForFeature(layer: AbstractGVLayer, feature: FeatureLike, label: string, filterEquation?: FilterNodeArrayType, legendFilterIsOff?: boolean): Style | undefined;
}
