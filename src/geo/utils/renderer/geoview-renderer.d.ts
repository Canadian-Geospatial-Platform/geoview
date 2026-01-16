import { Style, Text } from 'ol/style';
import type { Geometry } from 'ol/geom';
import type { Options as StrokeOptions } from 'ol/style/Stroke';
import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import type { TypeLayerStyleConfigType, TypePolygonVectorConfig, TypeIconSymbolVectorConfig, TypeLineStyle, TypeLineStringVectorConfig, TypeSimpleSymbolVectorConfig, TypeKindOfVectorSettings, TypeStyleGeometry, TypeLayerStyleSettings, TypeLayerStyleConfig, TypeLayerStyleConfigInfo, TypeLayerStyleValueCondition, TypeLayerTextConfig, TypeLayerStyleVisualVariable, TypeAliasLookup, TypeValidMapProjectionCodes } from '@/api/types/map-schema-types';
import type { TypeLayerMetadataFields } from '@/api/types/layer-schema-types';
import type { FillPatternLine, FillPatternSettings, FilterNodeType } from './geoview-renderer-types';
import type { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
type TypeStyleProcessor = (styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions) => Style | undefined;
/**
 * Options object for processing styles with optional parameters
 */
type TypeStyleProcessorOptions = {
    filterEquation?: FilterNodeType[];
    legendFilterIsOff?: boolean;
    domainsLookup?: TypeLayerMetadataFields[];
    aliasLookup?: TypeAliasLookup;
    visualVariables?: TypeLayerStyleVisualVariable[];
};
export declare abstract class GeoviewRenderer {
    #private;
    /**
     * Get the default color using the default color index.
     *
     * @param {number} alpha - Alpha value to associate to the color.
     * @param {boolean} increment - True, if we want to skip to next color
     *
     * @returns {string} The current default color string.
     * @static
     */
    static getDefaultColor(alpha: number, increment?: boolean): string;
    /**
     * This method returns the type of geometry. It removes the Multi prefix because for the geoviewRenderer, a MultiPoint has
     * the same behaviour than a Point.
     *
     * @param {FeatureLike} feature - The feature to check
     *
     * @returns {TypeStyleGeometry} The type of geometry (Point, LineString, Polygon).
     * @static
     */
    static getGeometryType(feature: FeatureLike): TypeStyleGeometry;
    /**
     * Decodes a base64-encoded SVG string and replaces parameterized placeholders
     * (e.g., `param(fill)` or `param(outline)`) with actual values provided
     * as query parameters appended to the base64 string.
     * This is particularly useful for decoding and normalizing SVG symbols
     * exported from QGIS, which may include dynamic styling parameters such as
     * `fill`, `stroke`, or `outline` values.
     * The method also applies various cleanup steps to improve SVG compatibility:
     * - Fixes QGIS-specific attribute spacing (e.g. `"stroke="` issues)
     * - Corrects malformed opacity or width attributes
     * - Removes extraneous `<title>`, `<desc>`, `<defs>` tags
     * - Removes XML headers that can cause encoding errors
     * @param {string} base64 - The base64-encoded SVG string, optionally including
     *   query parameters (e.g. `"base64:...?...fill=%23ff0000&outline=%23000000"`).
     * @returns {string} The decoded, cleaned, and parameter-substituted SVG XML string.
     * @static
     */
    static base64ToSVGString(base64: string): string;
    /**
     * Encodes an SVG XML string into a base64-encoded string.
     * This is the inverse of {@link base64ToSVGString}, allowing you to safely
     * embed or transmit SVG data in formats where raw XML is not permitted.
     * @param {string} svgXML - The raw SVG XML string to encode.
     * @returns {string} A base64-encoded representation of the SVG string.
     * @static
     */
    static SVGStringToBase64(svgXML: string): string;
    /**
     * This method loads the image of an icon that compose the legend.
     *
     * @param {string} src - Source information (base64 image) of the image to load.
     *
     * @returns {Promise<HTMLImageElement>} A promise that the image is loaded.
     * @static
     */
    static loadImage(src: string): Promise<HTMLImageElement | null>;
    /**
     * This method creates a canvas with the image of an icon that is defined in the point style.
     *
     * @param {Style} pointStyle - Style associated to the point symbol.
     *
     * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
     * @static
     */
    static createIconCanvas(pointStyle?: Style): Promise<HTMLCanvasElement | null>;
    /**
     * This method creates a canvas with the vector point settings that are defined in the point style.
     *
     * @param {Style} pointStyle - Style associated to the point symbol.
     *
     * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
     * @static
     */
    static createPointCanvas(pointStyle?: Style): HTMLCanvasElement;
    /**
     * This method creates a canvas with the lineString settings that are defined in the style.
     *
     * @param {Style} lineStringStyle - Style associated to the lineString.
     *
     * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
     * @static
     */
    static createLineStringCanvas(lineStringStyle?: Style): HTMLCanvasElement;
    /**
     * This method creates a canvas with the polygon settings that are defined in the style.
     *
     * @param {Style} polygonStyle - Style associated to the polygon.
     *
     * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
     * @static
     */
    static createPolygonCanvas(polygonStyle?: Style): HTMLCanvasElement;
    /**
     * Create the stroke options using the specified settings.
     *
     * @param {TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig} settings - Settings to use
     * for the stroke options creation.
     *
     * @returns {StrokeOptions} The stroke options created.
     * @static
     */
    static createStrokeOptions(settings: TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig): StrokeOptions;
    /**
     * Execute an operator using the nodes on the data stack. The filter equation is evaluated using a postfix notation. The result
     * is pushed back on the data stack. If a problem is detected, an error object is thrown with an explanatory message.
     *
     * @param {FilterNodeType} operator - Operator to execute.
     * @param {FilterNodeType[]} dataStack - Data stack to use for the operator execution.
     * @static
     */
    static executeOperator(operator: FilterNodeType, dataStack: FilterNodeType[]): void;
    /**
     * Use the filter equation and the feature fields to determine if the feature is visible.
     *
     * @param {Feature} feature - Feature used to find the visibility value to return.
     * @param {FilterNodeType[]} filterEquation - Filter used to find the visibility value to return.
     *
     * @returns {boolean | undefined} The visibility flag for the feature specified.
     * @static
     */
    static featureIsNotVisible(feature: Feature, filterEquation: FilterNodeType[]): boolean | undefined;
    /**
     * Process a circle symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processCircleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a star shape symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     * @param {number} points - Number of points needed to create the symbol.
     * @param {number} angle - Angle to use for the symbol creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processStarShapeSymbol(settings: TypeSimpleSymbolVectorConfig, points: number, angle: number): Style | undefined;
    /**
     * Process a star symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processStarSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a X symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processXSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a + symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processPlusSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a regular shape using the settings, the number of points, the angle and the scale.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     * @param {number} points - Number of points needed to create the symbol.
     * @param {number} angle - Angle to use for the symbol creation.
     * @param {[number, number]} scale - Scale to use for the symbol creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processRegularShape(settings: TypeSimpleSymbolVectorConfig, points: number, angle: number, scale: [number, number]): Style | undefined;
    /**
     * Process a square symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processSquareSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a Diamond symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processDiamondSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a triangle symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processTriangleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process an icon symbol using the settings.
     *
     * @param {TypeIconSymbolVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processIconSymbol(settings: TypeIconSymbolVectorConfig): Style | undefined;
    /**
     * Process a simple point symbol using the settings. Simple point symbol may be an icon or a vector symbol.
     *
     * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Settings to use for the Style creation.
     * @param {Feature} feature - Optional feature. This method does not use it, it is there to have a homogeneous signature.
     * @param {TypeStyleProcessorOptions} options - Optional processing options.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processSimplePoint(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process a simple lineString using the settings.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Settings to use for the Style creation.
     * @param {Feature} feature - Optional feature. This method does not use it, it is there to have a homogeneous signature.
     * @param {TypeStyleProcessorOptions} options - Optional processing options.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processSimpleLineString(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process a simple solid fill (polygon) using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processSolidFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a null fill (polygon with fill opacity = 0) using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processNullFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a pattern fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     * @param {FillPatternLine[]} FillPatternLines - Fill pattern lines needed to create the fill.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processPatternFill(settings: TypePolygonVectorConfig, FillPatternLines: FillPatternLine[], geometry?: Geometry): Style | undefined;
    /**
     * Process a backward diagonal fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processBackwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a forward diagonal fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processForwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a cross fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a diagonal cross fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processDiagonalCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a horizontal fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processHorizontalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a vertical fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processVerticalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a dot fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processDotFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a simple polygon using the settings.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Settings to use for the Style creation.
     * @param {Feature} feature - Optional feature. This method does not use it, it is there to have a homogeneous signature.
     * @param {TypeStyleProcessorOptions} options - Optional processing options
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processSimplePolygon(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * This method is used to process the array of point styles as described in the pointStyleConfig.
     *
     * @param {TypeVectorLayerStyles} layerStyle - Object that will receive the created canvas.
     * @param {TypeLayerStyleConfigInfo[]} arrayOfPointStyleConfig - Array of point style configuration.
     * @returns {Promise<TypeVectorLayerStyles>} A promise that the vector layer style is created.
     * @static
     */
    static processArrayOfPointStyleConfig(layerStyles: TypeVectorLayerStyles, arrayOfPointStyleConfig: TypeLayerStyleConfigInfo[]): Promise<TypeVectorLayerStyles>;
    /**
     * This method gets the legend styles used by the the layer as specified by the style configuration.
     *
     * @param {TypeStyleConfig} styleConfig - The style configuration.
     *
     * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
     * @static
     */
    static getLegendStyles(styleConfig: TypeLayerStyleConfig | undefined): Promise<TypeVectorLayerStyles>;
    /**
     * Create a default style to use with a vector feature that has no style configuration.
     *
     * @param {TypeStyleGeometry} geometryType - Type of geometry (Point, LineString, Polygon).
     * @param {string} label - Label for the style.
     *
     * @returns {TypeLayerStyleConfigInfo | undefined} The Style configuration created. Undefined if unable to create it.
     * @static
     */
    static createDefaultStyle(geometryType: TypeStyleGeometry, label: string): TypeLayerStyleSettings | undefined;
    /**
     * Interpolate a value between two stops linearly.
     *
     * @param {number} value - The data value to interpolate for.
     * @param {number} value1 - The lower data value.
     * @param {number} value2 - The upper data value.
     * @param {number} output1 - The output at the lower value.
     * @param {number} output2 - The output at the upper value.
     * @returns {number} The interpolated output value.
     * @static
     */
    static interpolateValue(value: number, value1: number, value2: number, output1: number, output2: number): number;
    /**
     * Interpolate a color between two hex colors.
     *
     * @param {number} value - The data value to interpolate for.
     * @param {number} value1 - The lower data value.
     * @param {number} value2 - The upper data value.
     * @param {string | number[]} color1 - The hex color at the lower value.
     * @param {string | number[]} color2 - The hex color at the upper value.
     * @returns {string} The interpolated color in rgba format.stat
     * @static
     */
    static interpolateColor(value: number, value1: number, value2: number, color1: string | number[], color2: string | number[]): string;
    /**
     * Evaluate a simple value expression using feature data.
     * Supports basic arithmetic operations and field references.
     *
     * @param {string} expression - Expression string (e.g., "$feature[\"FIELD_NAME\"] + 90")
     * @param {Feature} feature - Feature containing field data
     * @returns {number | null} The evaluated result or null if evaluation fails
     * @static
     */
    static evaluateValueExpression(expression: string, feature: Feature): number | null;
    /**
     * Search the unique value entry using the field values stored in the feature.
     *
     * @param {string[]} fields - Fields involved in the unique value definition.
     * @param {TypeLayerStyleConfigInfo[]?} uniqueValueStyleInfo - Unique value configuration.
     * @param {Feature?} feature - Feature used to test the unique value conditions.
     * @param {TypeLayerMetadataFields[]?} domainsLookup - An optional lookup table to handle coded value domains.
     * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
     * @returns {TypeLayerStyleConfigInfo | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static searchUniqueValueEntry(fields: string[], uniqueValueStyleInfo: TypeLayerStyleConfigInfo[], feature?: Feature, domainsLookup?: TypeLayerMetadataFields[], aliasLookup?: TypeAliasLookup): TypeLayerStyleConfigInfo | undefined;
    /**
     * Process the unique value settings using a point feature to get its Style.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
     * @param {Feature?} feature - Feature used to test the unique value conditions.
     * @param {TypeStyleProcessorOptions?} options - Optional processing options.
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processUniqueValuePoint(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process the unique value settings using a lineString feature to get its Style.
     *
     * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
     * @param {Feature?} feature - Feature used to test the unique value conditions.
     * @param {TypeStyleProcessorOptions?} options - Optional processing options.
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processUniqueLineString(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process the unique value settings using a polygon feature to get its Style.
     *
     * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
     * @param {Feature?} feature - Feature used to test the unique value conditions.
     * @param {TypeStyleProcessorOptions?} options - Optional processing options.
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processUniquePolygon(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Search the class breakentry using the field value stored in the feature.
     *
     * @param {string} field - Field involved in the class break definition.
     * @param {TypeLayerStyleConfigInfo[]} classBreakStyleInfo - Class break configuration.
     * @param {Feature} feature - Feature used to test the class break conditions.
     * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
     * @returns {number | undefined} The index of the entry. Undefined if unable to find it.
     * @static
     */
    static searchClassBreakEntry(field: string, classBreakStyleInfo: TypeLayerStyleConfigInfo[], feature: Feature, aliasLookup?: TypeAliasLookup): TypeLayerStyleConfigInfo | undefined;
    /**
     * Check whether a numeric value falls within a class-break interval using provided boundary conditions.
     * The `conditions` parameter is expected to be a two-element array where:
     * - conditions[0] is the lower-bound operator: 'gt' (>) or 'gte' (>=)
     * - conditions[1] is the upper-bound operator: 'lt' (<) or 'lte' (<=)
     * Examples:
     * - ['gte','lte'] => min <= value <= max
     * - ['gt','lte']  => min < value <= max
     * @param {number} value - The numeric value to test.
     * @param {number} min - The lower bound of the interval.
     * @param {number} max - The upper bound of the interval.
     * @param {TypeLayerStyleValueCondition[]} conditions - Two-element array describing the boundary operators.
     * @returns {boolean} True if the value satisfies the interval according to the conditions, false otherwise.
     * @throws {NotSupportedError} If `conditions` contains an unsupported combination of operators.
     * @static
     */
    static searchClassBreakEntryCheck(value: number, min: number, max: number, conditions: TypeLayerStyleValueCondition[]): boolean;
    /**
     * Process the class break settings using a Point feature to get its Style.
     *
     * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
     * @param {Feature} feature - Feature used to test the unique value conditions.
     * @param {TypeStyleProcessorOptions?} options - Optional processing options.
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processClassBreaksPoint(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process the class break settings using a lineString feature to get its Style.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
     * @param {Feature} feature - Feature used to test the unique value conditions.
     * @param {TypeStyleProcessorOptions?} options - Optional processing options.
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processClassBreaksLineString(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process the class break settings using a Polygon feature to get its Style.
     *
     * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
     * @param {Feature} feature - Feature used to test the unique value conditions.
     * @param {TypeStyleProcessorOptions?} options - Optional processing options.
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     * @static
     */
    static processClassBreaksPolygon(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * This method gets the style of the feature using the layer entry config. If the style does not exist for the geometryType,
     * create it using the default style strategy.
     * @param {FeatureLike} feature - Feature that need its style to be defined.
     * @param {number} resolution - The resolution of the map
     * @param {TypeStyleConfig} style - The style to use
     * @param {string} label - The style label when one has to be created
     * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
     * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
     * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
     * @param {TypeLayerTextConfig?} layerText - An optional text configuration to apply to the feature
     * @param {() => Promise<string | null>} callbackWhenCreatingStyle - An optional callback to execute when a new style had to be created
     * @returns {Style | undefined} The style applied to the feature or undefined if not found.
     * @static
     */
    static getAndCreateFeatureStyle(feature: FeatureLike, resolution: number, style: TypeLayerStyleConfig, label: string, filterEquation?: FilterNodeType[], legendFilterIsOff?: boolean, aliasLookup?: TypeAliasLookup, layerText?: TypeLayerTextConfig, callbackWhenCreatingStyle?: (geometryType: TypeStyleGeometry, style: TypeLayerStyleConfigInfo) => void): Style | undefined;
    /**
     * This method gets the image source from the style of the feature using the layer entry config.
     * @param {Feature} feature - The feature that need its icon to be defined.
     * @param {TypeStyleConfig} style - The style to use
     * @param {FilterNodeType[]?} filterEquation - Filter equation associated to the layer.
     * @param {boolean?} legendFilterIsOff - When true, do not apply legend filter.
     * @param {TypeLayerMetadataFields[]?} domainsLookup - An optional lookup table to handle coded value domains.
     * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
     * @returns {string} The icon associated to the feature or a default empty one.
     * @static
     */
    static getFeatureImageSource(feature: Feature, style: TypeLayerStyleConfig, filterEquation?: FilterNodeType[], legendFilterIsOff?: boolean, domainsLookup?: TypeLayerMetadataFields[], aliasLookup?: TypeAliasLookup): string | undefined;
    /**
     * Classify the remaining nodes to complete the classification. The plus and minus can be a unary or a binary operator. It is
     * only at the end that we can determine there node type. Nodes that start with a number are numbers, otherwise they are
     * variables. If a problem is detected, an error object is thrown with an explanatory message.
     *
     * @param {FilterNodeType[]} keywordArray - Array of keywords to process.
     *
     * @returns {FilterNodeType[]} The new keywords array with all nodes classified.
     * @static
     */
    static classifyUnprocessedNodes(keywordArray: FilterNodeType[]): FilterNodeType[];
    /**
     * Extract the specified keyword and associate a node type to their nodes. In some cases, the extraction uses an optionally
     * regular expression.
     *
     * @param {FilterNodeType[]} FilterNodeArrayType - Array of keywords to process.
     * @param {string} keyword - Keyword to extract.
     * @param {RegExp} regExp - An optional regular expression to use for the extraction.
     *
     * @returns {FilterNodeType[]} The new keywords array.
     * @static
     */
    static extractKeyword(filterNodeArray: FilterNodeType[], keyword: string, regExp?: RegExp): FilterNodeType[];
    /**
     * Extract the string nodes from the keyword array. This operation is done at the beginning of the classification. This allows
     * to considere Keywords in a string as a normal word. If a problem is detected, an error object is thrown with an explanatory
     * message.
     *
     * @param {FilterNodeType[]} keywordArray - Array of keywords to process.
     *
     * @returns {FilterNodeType[]} The new keywords array with all string nodes classified.
     * @static
     */
    static extractStrings(keywordArray: FilterNodeType[]): FilterNodeType[];
    /**
     * Analyse the filter and split it in syntaxique nodes.  If a problem is detected, an error object is thrown with an
     * explanatory message.
     *
     * @param {FilterNodeType[]} filterNodeArrayType - Node array to analyse.
     *
     * @returns {FilterNodeType[]} The new node array with all nodes classified.
     * @static
     */
    static analyzeLayerFilter(filterNodeArrayType: FilterNodeType[]): FilterNodeType[];
    /** Table used to define line symbology to use when drawing lineString and polygon perimeters */
    static lineDashSettings: Record<TypeLineStyle, number[] | undefined>;
    /** Table used to define line symbology to use when drawing polygon fill */
    static FillPatternSettings: FillPatternSettings;
    /** Table of function to process the style settings based on the feature geometry and the kind of style settings. */
    static processStyle: Record<TypeLayerStyleConfigType, Record<TypeStyleGeometry, TypeStyleProcessor>>;
    /**
     * Method for getting the text style
     * @param {FeatureLike} feature - The feature to get the text style for
     * @param {number} resolution - The resolution of the map
     * @param {TypeLayerStyleSettings} styleSettings - The style settings
     * @param {TypeLayerTextConfig} layerText - The layer text configuration
     * @param {TypeAliasLookup} aliasLookup - The alias lookup
     * @returns {Text | undefined} The text style
     * @static
     */
    static getTextStyle: (feature: FeatureLike, resolution: number, styleSettings: TypeLayerStyleSettings, layerText?: TypeLayerTextConfig, aliasLookup?: TypeAliasLookup) => Text | undefined;
    /**
     * Method for creating Text Style
     * @param {FeatureLike} feature - The feature to create the text style for
     * @param {TypeLayerTextConfig} textSettings - The text style settings
     * @returns {Text | undefined} The text style
     * @static
     */
    static createTextStyle: (feature: FeatureLike, textSettings: TypeLayerTextConfig) => Text | undefined;
    /**
     * Get approximate resolution for common zoom levels by projection
     * @param {number} zoom - The zoom level (0-20)
     * @param {TypeValidMapProjectionCodes} projection - The map projection (3857 for Web Mercator, 3978 for Canada Lambert)
     * @returns {number} Approximate resolution for the given zoom and projection
     * @static
     */
    static getApproximateResolution(zoom: number, projection?: TypeValidMapProjectionCodes): number;
    /**
     * Wrap text to fit within specified constraints
     * @param {string} str - The text to wrap
     * @param {number} width - The maximum width per line
     * @param {number} maxLines - Maximum number of lines (optional, overrides width if needed)
     * @returns {string} The wrapped text
     * @static
     */
    static wrapText(str: string, width: number, maxLines?: number): string;
    /**
     * Wrap text to a specified width using word boundaries
     * @param {string} str - The text to wrap
     * @param {number} width - The maximum width of each line
     * @returns {string} The wrapped text
     * @static
     */
    static wrapTextByWidth(str: string, width: number): string;
    /**
     * Process text template by replacing field placeholders with feature values
     * Expects somewhat clean field names, so we shouldn't need to worry about escaping special characters (Dates may still have characters after the colon)
     * @param {string} template - The text template with {field-name} placeholders
     * @param {FeatureLike} feature - The feature to get field values from
     * @returns {string} The processed text with field values substituted
     * @static
     */
    static processTextTemplate(template: string, feature: FeatureLike): string;
}
export {};
//# sourceMappingURL=geoview-renderer.d.ts.map