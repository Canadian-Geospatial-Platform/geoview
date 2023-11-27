import Feature from 'ol/Feature';
import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { VectorImage as VectorLayer } from 'ol/layer';
import { Geometry } from 'ol/geom';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeBaseLayerEntryConfig, TypeLayerEntryConfig, TypeListOfLayerEntryConfig, TypeVectorLayerEntryConfig } from '@/geo/map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries } from '@/api/events/payloads';
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Feature<Geometry>>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;
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
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
     * necessary, additional code can be executed in the child method to complete the layer configuration.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {Promise<BaseLayer | null>} The GeoView base layer that has been created.
     */
    protected processOneLayerEntry(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * Create a source configuration for the vector layer.
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration.
     * @param {SourceOptions} sourceOptions The source options (default: { strategy: all }).
     * @param {ReadOptions} readOptions The read options (default: {}).
     *
     * @returns {VectorSource<Geometry>} The source configuration that will be used to create the vector layer.
     */
    protected createVectorSource(layerEntryConfig: TypeBaseLayerEntryConfig, sourceOptions?: SourceOptions, readOptions?: ReadOptions): VectorSource<Feature<Geometry>>;
    /** ***************************************************************************************************************************
     * Create a vector layer. The layer has in its properties a reference to the layer entry configuration used at creation time.
     * The layer entry configuration keeps a reference to the layer in the olLayer attribute. If clustering is enabled, creates a
     * cluster source and uses that to create the layer.
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration used by the source.
     * @param {VectorSource<Feature<Geometry>>} vectorSource The source configuration for the vector layer.
     *
     * @returns {VectorLayer<VectorSource>} The vector layer created.
     */
    createVectorLayer(layerEntryConfig: TypeVectorLayerEntryConfig, vectorSource: VectorSource<Feature<Geometry>>): VectorLayer<VectorSource>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features stored in the layer.
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration.
     *
     * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
     */
    protected getAllFeatureInfo(layerEntryConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided Pixel.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided projected coordinate.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided longitude latitude.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtLongLat(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig, returns updated bounds
     *
     * @param {TypeLayerEntryConfig} layerConfig Layer config to get bounds from.
     * @param {Extent | undefined} bounds The current bounding box to be adjusted.
     *
     * @returns {Extent} The layer bounding box.
     */
    protected getBounds(layerConfig: TypeLayerEntryConfig, bounds: Extent | undefined): Extent | undefined;
    /** ***************************************************************************************************************************
     * Apply a view filter to the layer. When the CombineLegendFilter flag is false, the filter paramater is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     *
     * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
     * @param {string} filter An optional filter to be used in place of the getViewFilter value.
     * @param {boolean} CombineLegendFilter Flag used to combine the legend filter and the filter together (default: true)
     * @param {boolean} checkCluster An optional value to see if we check for clustered layers.
     */
    applyViewFilter(layerPathOrConfig: string | TypeLayerEntryConfig, filter?: string, CombineLegendFilter?: boolean, checkCluster?: boolean): void;
}
