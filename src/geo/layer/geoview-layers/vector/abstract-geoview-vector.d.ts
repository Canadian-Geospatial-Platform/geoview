import { Vector as VectorSource } from 'ol/source';
import { Options as SourceOptions } from 'ol/source/Vector';
import { Geometry } from 'ol/geom';
import { ReadOptions } from 'ol/format/Feature';
import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Pixel } from 'ol/pixel';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { TypeBaseLayerEntryConfig, TypeLayerEntryConfig, TypeListOfLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries } from '../../../../api/events/payloads/get-feature-info-payload';
export type TypeVectorLayerGroup = LayerGroup;
export type TypeVectorLayer = VectorSource<Geometry>;
export type TypeBaseVectorLayer = BaseLayer | TypeVectorLayerGroup | TypeVectorLayer;
/** ******************************************************************************************************************************
 * The AbstractGeoViewVector class is a direct descendant of AbstractGeoViewLayer. As its name indicates, it is used to
 * instanciate GeoView vector layers. It inherits from its parent class an attribute named gvLayers where the vector elements
 * of the class will be kept.
 *
 * The gvLayers attribute has a hierarchical structure. Its data type is TypetBaseVectorLayer. Subclasses of this type
 * are TypeVectorLayerGroup and TypeVectorLayer. The TypeVectorLayerGroup is a collection of TypetBaseVectorLayer. It is
 * important to note that a TypetBaseVectorLayer attribute can polymorphically refer to a TypeVectorLayerGroup or a
 * TypeVectorLayer. Here, we must not confuse instantiation and declaration of a polymorphic attribute.
 *
 * All leaves of the tree structure stored in the gvLayers attribute must be of type TypeVectorLayer. This is where the
 * features are placed and can be considered as a feature group.
 */
export declare abstract class AbstractGeoViewVector extends AbstractGeoViewLayer {
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected abstract getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
     * necessary, additional code can be executed in the child method to complete the layer configuration.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
     */
    protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
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
    protected createVectorSource(layerEntryConfig: TypeBaseLayerEntryConfig, sourceOptions?: SourceOptions, readOptions?: ReadOptions): VectorSource<Geometry>;
    /** ***************************************************************************************************************************
     * Create a vector layer. The layer has in its properties a reference to the layer entry configuration used at creation time.
     * The layer entry configuration keeps a reference to the layer in the gvLayer attribute. If clustering is enabled, creates a
     * cluster source and uses that to create the layer.
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration used by the source.
     * @param {VectorSource<Geometry>} vectorSource The source configuration for the vector layer.
     *
     * @returns {VectorLayer<VectorSource>} The vector layer created.
     */
    private createVectorLayer;
    /** ***************************************************************************************************************************
     * Convert the feature information to an array of TypeArrayOfFeatureInfoEntries.
     *
     * @param {Feature<Geometry>[]} features The array of features to convert.
     * @param {TypeFeatureInfoLayerConfig} featureInfo The featureInfo configuration.
     *
     * @returns {TypeArrayOfFeatureInfoEntries} The Array of feature information.
     */
    private formatFeatureInfoResult;
    /** ***************************************************************************************************************************
     * Return feature information for all the features stored in the layer.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {TypeArrayOfFeatureInfoEntries} The feature info table.
     */
    getAllFeatureInfo(layerPathOrConfig?: string | TypeLayerEntryConfig | null | undefined): TypeArrayOfFeatureInfoEntries;
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
     * Return feature information for all the features in the provided bounding box.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided polygon.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Compute the layer bounds or undefined if the result can not be obtained from le feature extents that compose the layer. If
     * layerPathOrConfig is undefined, the active layer is used. If projectionCode is defined, returns the bounds in the specified
     * projection otherwise use the map projection. The bounds are different from the extent. They are mainly used for display
     * purposes to show the bounding box in which the data resides and to zoom in on the entire layer data. It is not used by
     * openlayer to limit the display of data on the map.
     *
     * @param {string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null} layerPathOrConfig Optional layer path or
     * configuration.
     * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
     *
     * @returns {Extent} The layer bounding box.
     */
    calculateBounds(layerPathOrConfig?: string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null, projectionCode?: string | number | undefined): Extent | undefined;
    /** ***************************************************************************************************************************
     * Apply a view filter to the layer. When the optional filter parameter is not empty (''), it is used alone to display the
     * features. Otherwise, the legend filter and the layerFilter are used to define the view filter and the resulting filter is
     * (legend filters) and (layerFilter). The legend filters are derived from the uniqueValue or classBreaks style of the layer.
     * When the layer config is invalid, nothing is done.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     * @param {string} filter An optional filter to be used in place of the getViewFilter value.
     */
    applyViewFilter(layerPathOrConfig?: string | TypeLayerEntryConfig | null, filter?: string): void;
    /** ***************************************************************************************************************************
     * Set the layerFilter that will be applied with the legend filters derived from the uniqueValue or classBreabs style of
     * the layer. The resulting filter will be (legend filters) and (layerFilter). When the layer config is invalid, nothing is
     * done.
     *
     * @param {string} filterValue The filter to associate to the layer.
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     */
    setLayerFilter(filterValue: string, layerPathOrConfig?: string | TypeLayerEntryConfig | null): void;
    /** ***************************************************************************************************************************
     * Get the layerFilter that is associated to the layer. Returns undefined when the layer config is invalid.
     * If layerPathOrConfig is undefined, this.activeLayer is used.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {string | undefined} The filter associated to the layer or undefined.
     */
    getLayerFilter(layerPathOrConfig?: string | TypeLayerEntryConfig | null): string | undefined;
}
