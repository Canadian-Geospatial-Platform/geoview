import { Style } from 'ol/style';
import Feature, { FeatureLike } from 'ol/Feature';
import { TypeLayerStyleConfigType, TypeKindOfVectorSettings, TypeStyleGeometry, TypeLayerStyleSettings, TypeLayerStyleConfig, TypeLayerStyleConfigInfo, TypeAliasLookup } from '@/api/config/types/map-schema-types';
import { FilterNodeType } from './geoview-renderer-types';
import { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeJsonArray } from '@/api/config/types/config-types';
type TypeStyleProcessor = (styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, filterEquation?: FilterNodeType[], legendFilterIsOff?: boolean, domainsLookup?: TypeJsonArray, aliasLookup?: TypeAliasLookup) => Style | undefined;
/**
 * This method returns the type of geometry. It removes the Multi prefix because for the geoviewRenderer, a MultiPoint has
 * the same behaviour than a Point.
 *
 * @param {FeatureLike} feature - The feature to check
 *
 * @returns {TypeStyleGeometry} The type of geometry (Point, LineString, Polygon).
 */
export declare const getGeometryType: (feature: FeatureLike) => TypeStyleGeometry;
/**
 * This method loads the image of an icon that compose the legend.
 *
 * @param {string} src - Source information (base64 image) of the image to load.
 *
 * @returns {Promise<HTMLImageElement>} A promise that the image is loaded.
 */
export declare function loadImage(src: string): Promise<HTMLImageElement | null>;
/**
 * This method gets the legend styles used by the the layer as specified by the style configuration.
 *
 * @param {TypeStyleConfig} styleConfig - The style configuration.
 *
 * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
 */
export declare function getLegendStyles(styleConfig: TypeLayerStyleConfig | undefined): Promise<TypeVectorLayerStyles>;
/** Table of function to process the style settings based on the feature geometry and the kind of style settings. */
export declare const processStyle: Record<TypeLayerStyleConfigType, Record<TypeStyleGeometry, TypeStyleProcessor>>;
/**
 * This method gets the style of the feature using the layer entry config. If the style does not exist for the geometryType,
 * create it using the default style strategy.
 * @param {FeatureLike} feature - Feature that need its style to be defined.
 * @param {TypeStyleConfig} style - The style to use
 * @param {string} label - The style label when one has to be created
 * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
 * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
 * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
 * @param {() => Promise<string | null>} callbackWhenCreatingStyle - An optional callback to execute when a new style had to be created
 * @returns {Style | undefined} The style applied to the feature or undefined if not found.
 */
export declare function getAndCreateFeatureStyle(feature: FeatureLike, style: TypeLayerStyleConfig, label: string, filterEquation?: FilterNodeType[], legendFilterIsOff?: boolean, aliasLookup?: TypeAliasLookup, callbackWhenCreatingStyle?: (geometryType: TypeStyleGeometry, style: TypeLayerStyleConfigInfo) => void): Style | undefined;
/**
 * This method gets the image source from the style of the feature using the layer entry config.
 * @param {Feature} feature - The feature that need its icon to be defined.
 * @param {TypeStyleConfig} style - The style to use
 * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
 * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
 * @param {TypeJsonArray?} domainsLookup - An optional lookup table to handle coded value domains.
 * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
 * @returns {string} The icon associated to the feature or a default empty one.
 */
export declare function getFeatureImageSource(feature: Feature, style: TypeLayerStyleConfig, filterEquation?: FilterNodeType[], legendFilterIsOff?: boolean, domainsLookup?: TypeJsonArray, aliasLookup?: TypeAliasLookup): string | undefined;
/**
 * Analyse the filter and split it in syntaxique nodes.  If a problem is detected, an error object is thrown with an
 * explanatory message.
 *
 * @param {FilterNodeType[]} filterNodeArrayType - Node array to analyse.
 *
 * @returns {FilterNodeType[]} The new node array with all nodes classified.
 */
export declare function analyzeLayerFilter(filterNodeArrayType: FilterNodeType[]): FilterNodeType[];
export {};
//# sourceMappingURL=geoview-renderer.d.ts.map