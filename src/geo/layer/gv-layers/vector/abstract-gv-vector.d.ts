import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import Feature, { FeatureLike } from 'ol/Feature';
import { FilterNodeArrayType } from '@/geo/utils/renderer/geoview-renderer-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { AbstractGVLayer } from '../abstract-gv-layer';
import { AbstractGeoViewLayer } from '../../geoview-layers/abstract-geoview-layers';
/**
 * Abstract Geoview Layer managing an OpenLayer vector type layer.
 */
export declare abstract class AbstractGVVector extends AbstractGVLayer {
    /**
     * Constructs a GeoView Vector layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {VectorLayerEntryConfig} layerConfig - The layer configuration.
     */
    protected constructor(mapId: string, olSource: VectorSource, layerConfig: VectorLayerEntryConfig);
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {VectorLayer<Feature>} The OpenLayers Layer
     */
    getOLLayer(): VectorLayer<Feature>;
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
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string): 'string' | 'date' | 'number';
    /**
     * Overrides the get all feature information for all the features stored in the layer.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getAllFeatureInfo(): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overrides the return of feature information at a given pixel location.
     * @param {Coordinate} location - The pixel coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtPixel(location: Pixel): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {Coordinate} lnglat - The coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLongLat(lnglat: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null>;
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
    applyViewFilter(layerPath: string, filter: string, combineLegendFilter?: boolean): void;
    /**
     * Gets the bounds of the layer and returns updated bounds.
     * @returns {Extent | undefined} The layer bounding box.
     */
    getBounds(layerPath: string): Extent | undefined;
    /**
     * Gets the extent of an array of features.
     * @param {string} layerPath - The layer path.
     * @param {string[]} objectIds - The uids of the features to calculate the extent from.
     * @returns {Promise<Extent | undefined>} The extent of the features, if available.
     */
    getExtentFromFeatures(layerPath: string, objectIds: string[]): Promise<Extent | undefined>;
    /**
     * Return the vector layer as a GeoJSON object
     * @returns {JSON} Layer's features as GeoJSON
     */
    getFeaturesAsGeoJSON(): JSON;
    /**
     * Calculates a style for the given feature, based on the layer current style and options.
     * @param {AbstractGeoViewLayer | AbstractGVLayer} layer - The layer on which to work for the style.
     * @param {FeatureLike} feature - Feature that need its style to be defined.
     * @param {string} label - The style label when one has to be created
     * @param {FilterNodeArrayType} filterEquation - Filter equation associated to the layer.
     * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
     * @returns {Style} The style for the feature
     */
    static calculateStyleForFeature(layer: AbstractGeoViewLayer | AbstractGVLayer, feature: FeatureLike, label: string, layerPath: string, filterEquation?: FilterNodeArrayType, legendFilterIsOff?: boolean): Style | undefined;
}
