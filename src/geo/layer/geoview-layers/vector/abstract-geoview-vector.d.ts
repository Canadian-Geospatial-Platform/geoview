import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeFeatureInfoEntry, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Feature>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;
/**
 * Determine if layer instance is a vector layer
 *
 * @param {AbstractGeoViewLayer} layer the layer to check
 * @returns {boolean} true if layer is a vector layer
 */
export declare const isVectorLayer: (layer: AbstractGeoViewLayer) => boolean;
/** *****************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. It inherits from its parent class an attribute named olLayers where the vector elements
 * of the class will be kept.
 *
 * The olLayers attribute has a hierarchical structure. Its data type is TypeBaseVectorLayer. Subclasses of this type are
 * BaseLayer, TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypeBaseVectorLayer. It is
 * important to note that a TypeBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the tree structure stored in the olLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
export declare abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
    #private;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
     * necessary, additional code can be executed in the child method to complete the layer configuration.
     *
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /** ***************************************************************************************************************************
     * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
     *
     * @param {string} fieldName field name for which we want to get the type.
     * @param {AbstractBaseLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number';
    /** ***************************************************************************************************************************
     * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
     *
     * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     *
     * @returns {Promise<BaseLayer | undefined>} The GeoView base layer that has been created.
     */
    protected processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined>;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: { strategy: all }).
     * @param {ReadOptions} readOptions The read options (default: {}).
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerConfig: AbstractBaseLayerEntryConfig, sourceOptions?: SourceOptions<Feature>, readOptions?: ReadOptions): VectorSource<Feature>;
    /** ***************************************************************************************************************************
     * Create a vector layer. The layer has in its properties a reference to the layer configuration used at creation time.
     * The layer entry configuration keeps a reference to the layer in the olLayer attribute.
     *
     * @param {VectorLayerEntryConfig} layerConfig The layer entry configuration used by the source.
     * @param {VectorSource} vectorSource The source configuration for the vector layer.
     *
     * @returns {VectorLayer<Feature>} The vector layer created.
     */
    protected createVectorLayer(layerConfig: VectorLayerEntryConfig, vectorSource: VectorSource): VectorLayer<Feature>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features stored in the layer.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getAllFeatureInfo(layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided Pixel.
     *
     * @param {Coordinate} location - The pixel coordinate that will be used by the query.
     * @param {string} layerPath - The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table or null if an error occured.
     */
    protected getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided projected coordinate.
     *
     * @param {Coordinate} location - The pixel coordinate that will be used by the query.
     * @param {string} layerPath - The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided longitude latitude.
     *
     * @param {Coordinate} lnglat - The coordinate that will be used by the query.
     * @param {string} layerPath - The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getFeatureInfoAtLongLat(lnglat: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
     *
     * @param {string} layerPath The Layer path to the layer's configuration.
     *
     * @returns {Extent | undefined} The new layer bounding box.
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
     * Overrides when the layer gets in loaded status.
     */
    onLoaded(layerConfig: AbstractBaseLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     * @param {string} filter A filter to be used in place of the getViewFilter value.
     * @param {boolean} combineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
     */
    applyViewFilter(layerPath: string, filter: string, combineLegendFilter?: boolean): void;
    /** ***************************************************************************************************************************
     * Converts csv text to feature array.
     *
     * @param {string} csvData The data from the .csv file.
     * @param {VectorLayerEntryConfig} layerConfig The config of the layer.
     *
     * @returns {Feature[]} The array of features.
     */
    static convertCsv(mapId: string, csvData: string, layerConfig: VectorLayerEntryConfig): Feature[] | undefined;
}
