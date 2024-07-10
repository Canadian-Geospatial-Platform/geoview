import { Style } from 'ol/style';
import Feature, { FeatureLike } from 'ol/Feature';
import { TypeStyleGeometry, TypeStyleConfig, TypeBaseStyleConfig } from '@/geo/map/map-schema-types';
import { FilterNodeArrayType } from './geoview-renderer-types';
import { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
/** ***************************************************************************************************************************
 * This method returns the type of geometry. It removes the Multi prefix because for the geoviewRenderer, a MultiPoint has
 * the same behaviour than a Point.
 *
 * @param {FeatureLike} feature - The feature to check
 *
 * @returns {TypeStyleGeometry} The type of geometry (Point, LineString, Polygon).
 */
export declare const getGeometryType: (feature: FeatureLike) => TypeStyleGeometry;
/** ***************************************************************************************************************************
 * This method loads the image of an icon that compose the legend.
 *
 * @param {string} src - Source information (base64 image) of the image to load.
 *
 * @returns {Promise<HTMLImageElement>} A promise that the image is loaded.
 */
export declare function loadImage(src: string): Promise<HTMLImageElement | null>;
/** ***************************************************************************************************************************
 * This method gets the legend styles used by the the layer as specified by the style configuration.
 *
 * @param {TypeStyleConfig} styleConfig - The style configuration.
 *
 * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
 */
export declare function getLegendStyles(styleConfig: TypeStyleConfig | undefined): Promise<TypeVectorLayerStyles>;
/** ***************************************************************************************************************************
 * This method gets the style of the feature using the layer entry config. If the style does not exist for the geometryType,
 * create it using the default style strategy.
 * @param {FeatureLike} feature - Feature that need its style to be defined.
 * @param {TypeStyleConfig} style - The style to use
 * @param {string} label - The style label when one has to be created
 * @param {FilterNodeArrayType} filterEquation - Filter equation associated to the layer.
 * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
 * @param {() => Promise<string | null>} callbackWhenCreatingStyle - An optional callback to execute when a new style had to be created
 * @returns {Style | undefined} The style applied to the feature or undefined if not found.
 */
export declare function getAndCreateFeatureStyle(feature: FeatureLike, style: TypeStyleConfig, label: string, filterEquation?: FilterNodeArrayType, legendFilterIsOff?: boolean, callbackWhenCreatingStyle?: (geometryType: TypeStyleGeometry, style: TypeBaseStyleConfig) => void): Style | undefined;
/** ***************************************************************************************************************************
 * This method gets the canvas icon from the style of the feature using the layer entry config.
 * @param {Feature} feature - The feature that need its canvas icon to be defined.
 * @param {TypeStyleConfig} style - The style to use
 * @param {FilterNodeArrayType} filterEquation - Filter equation associated to the layer.
 * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
 * @param {() => Promise<string | null>} callbackForDataUrl - An optional callback to execute when struggling to build a canvas and have to use a data url to make one
 * @returns {Promise<HTMLCanvasElement>} The canvas icon associated to the feature or a default empty canvas.
 */
export declare function getFeatureCanvas(feature: Feature, style: TypeStyleConfig, filterEquation?: FilterNodeArrayType, legendFilterIsOff?: boolean, callbackForDataUrl?: () => Promise<string | null>): Promise<HTMLCanvasElement>;
/** ***************************************************************************************************************************
 * Analyse the filter and split it in syntaxique nodes.  If a problem is detected, an error object is thrown with an
 * explanatory message.
 *
 * @param {FilterNodeArrayType} filterNodeArrayType - Node array to analyse.
 *
 * @returns {FilterNodeArrayType} The new node array with all nodes classified.
 */
export declare function analyzeLayerFilter(filterNodeArrayType: FilterNodeArrayType): FilterNodeArrayType;
