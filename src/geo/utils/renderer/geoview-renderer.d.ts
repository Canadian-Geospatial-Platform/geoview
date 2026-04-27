import { Style } from 'ol/style';
import type { Geometry } from 'ol/geom';
import type { Options as StrokeOptions } from 'ol/style/Stroke';
import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import type { TypeLayerStyleConfigType, TypePolygonVectorConfig, TypeIconSymbolVectorConfig, TypeLineStyle, TypeLineStringVectorConfig, TypeSimpleSymbolVectorConfig, TypeKindOfVectorSettings, TypeStyleGeometry, TypeLayerStyleSettings, TypeLayerStyleConfig, TypeLayerStyleConfigInfo, TypeLayerStyleValueCondition, TypeLayerStyleVisualVariable, TypeAliasLookup, TypeOutfields } from '@/api/types/map-schema-types';
import type { TypeLayerMetadataFields } from '@/api/types/layer-schema-types';
import type { FillPatternLine, FillPatternSettings, FilterNodeType } from './geoview-renderer-types';
type TypeStyleProcessor = (styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions) => Style | undefined;
/**
 * Options object for processing styles with optional parameters
 */
export type TypeStyleProcessorOptions = {
    filterEquation?: FilterNodeType[];
    /** Indicates if we want to return the symbol even if the symbol visibility is false */
    bypassVisibility?: boolean;
    domainsLookup?: TypeLayerMetadataFields[];
    aliasLookup?: TypeAliasLookup;
    visualVariables?: TypeLayerStyleVisualVariable[];
};
export declare abstract class GeoviewRenderer {
    #private;
    /** The default filter expression when all features should be included */
    static readonly DEFAULT_FILTER_1EQUALS1: string;
    /** The default filter expression when no features should be included */
    static readonly DEFAULT_FILTER_1EQUALS0: string;
    /** Default value of the legend canvas width when the settings do not provide one. */
    static readonly LEGEND_CANVAS_WIDTH = 50;
    /** Default value of the legend canvas height when the settings do not provide one. */
    static readonly LEGEND_CANVAS_HEIGHT = 50;
    /**
     * Get the default color using the default color index.
     *
     * @param alpha - Alpha value to associate to the color
     * @param increment - Optional true, if we want to skip to next color
     * @returns The current default color string
     */
    static getDefaultColor(alpha: number, increment?: boolean): string;
    /**
     * Returns the type of geometry.
     *
     * It removes the Multi prefix because for the geoviewRenderer, a MultiPoint has
     * the same behaviour than a Point.
     *
     * @param feature - The feature to check
     * @param defaultLayerStyle - The default layer style config to use when the feature has no geometry
     * @returns The type of geometry (Point, LineString, Polygon)
     */
    static readGeometryTypeSimplifiedFromFeature(feature: FeatureLike, defaultLayerStyle: TypeLayerStyleConfig): TypeStyleGeometry;
    /**
     * Returns the type of geometry.
     *
     * It removes the Multi prefix because for the geoviewRenderer, a MultiPoint has
     * the same behaviour than a Point.
     *
     * @param geometryType - The geometry type to check
     * @returns The type of geometry (Point, LineString, Polygon)
     */
    static readGeometryTypeSimplified(geometryType: TypeStyleGeometry): TypeStyleGeometry;
    /**
     * Decodes a base64-encoded SVG string and replaces parameterized placeholders.
     *
     * Placeholders like `param(fill)` or `param(outline)` are replaced with actual values
     * provided as query parameters appended to the base64 string.
     * This is particularly useful for decoding and normalizing SVG symbols
     * exported from QGIS, which may include dynamic styling parameters such as
     * `fill`, `stroke`, or `outline` values.
     * The method also applies various cleanup steps to improve SVG compatibility:
     * - Fixes QGIS-specific attribute spacing (e.g. `"stroke="` issues)
     * - Corrects malformed opacity or width attributes
     * - Removes extraneous `<title>`, `<desc>`, `<defs>` tags
     * - Removes XML headers that can cause encoding errors
     *
     * @param base64 - The base64-encoded SVG string, optionally including
     *   query parameters (e.g. `"base64:...?...fill=%23ff0000&outline=%23000000"`)
     * @returns The decoded, cleaned, and parameter-substituted SVG XML string
     */
    static base64ToSVGString(base64: string): string;
    /**
     * Encodes an SVG XML string into a base64-encoded string.
     *
     * This is the inverse of {@link base64ToSVGString}, allowing you to safely
     * embed or transmit SVG data in formats where raw XML is not permitted.
     *
     * @param svgXML - The raw SVG XML string to encode
     * @returns A base64-encoded representation of the SVG string
     */
    static SVGStringToBase64(svgXML: string): string;
    /**
     * Loads the image of an icon that compose the legend.
     *
     * @param src - Source information (base64 image) of the image to load
     * @returns A promise that resolves with the loaded image, or null if loading fails
     */
    static loadImage(src: string): Promise<HTMLImageElement | null>;
    /**
     * Creates a canvas with the image of an icon that is defined in the point style.
     *
     * @param pointStyle - Optional style associated to the point symbol
     * @returns A promise that resolves with the created canvas, or null if creation fails
     */
    static createIconCanvas(pointStyle?: Style): Promise<HTMLCanvasElement | null>;
    /**
     * Creates a canvas with the vector point settings that are defined in the point style.
     *
     * @param pointStyle - Optional style associated to the point symbol
     * @returns The created canvas
     */
    static createPointCanvas(pointStyle?: Style): HTMLCanvasElement;
    /**
     * Creates a canvas with the lineString settings that are defined in the style.
     *
     * @param lineStringStyle - Optional style associated to the lineString
     * @returns The created canvas
     */
    static createLineStringCanvas(lineStringStyle?: Style): HTMLCanvasElement;
    /**
     * Creates a canvas with the polygon settings that are defined in the style.
     *
     * @param polygonStyle - Optional style associated to the polygon
     * @returns The created canvas
     */
    static createPolygonCanvas(polygonStyle?: Style): HTMLCanvasElement;
    /**
     * Create the stroke options using the specified settings.
     *
     * @param settings - Settings to use for the stroke options creation
     * @returns The stroke options created
     */
    static createStrokeOptions(settings: TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig): StrokeOptions;
    /**
     * Execute an operator using the nodes on the data stack.
     *
     * The filter equation is evaluated using a postfix notation. The result
     * is pushed back on the data stack. If a problem is detected, an error object is thrown with an explanatory message.
     *
     * @param operator - Operator to execute
     * @param dataStack - Data stack to use for the operator execution
     */
    static executeOperator(operator: FilterNodeType, dataStack: FilterNodeType[]): void;
    /**
     * Evaluates whether a feature satisfies a parsed filter equation.
     *
     * The filter equation is expected to be in infix order and is evaluated using
     * a stack-based (shunting-yard–style) algorithm that respects operator
     * precedence and grouping.
     *
     * @param feature - The feature whose attributes are used to resolve variable nodes
     * @param filterEquation - Optional parsed filter expression tokens
     * @returns True if the feature satisfies the filter, false otherwise
     * @throws {Error} When the filter expression is invalid or cannot be evaluated
     */
    static featureRespectsFilterEquation(feature: Feature, filterEquation?: FilterNodeType[]): boolean;
    /**
     * Process a circle symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processCircleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a star shape symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param points - Number of points needed to create the symbol
     * @param angle - Angle to use for the symbol creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processStarShapeSymbol(settings: TypeSimpleSymbolVectorConfig, points: number, angle: number): Style | undefined;
    /**
     * Process a star symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processStarSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a X symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processXSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a + symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processPlusSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a regular shape using the settings, the number of points, the angle and the scale.
     *
     * @param settings - Settings to use for the Style creation
     * @param points - Number of points needed to create the symbol
     * @param angle - Angle to use for the symbol creation
     * @param scale - Scale to use for the symbol creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processRegularShape(settings: TypeSimpleSymbolVectorConfig, points: number, angle: number, scale: [number, number]): Style | undefined;
    /**
     * Process a square symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processSquareSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a Diamond symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processDiamondSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process a triangle symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processTriangleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined;
    /**
     * Process an icon symbol using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @returns The Style created, or undefined if unable to create it
     */
    static processIconSymbol(settings: TypeIconSymbolVectorConfig): Style | undefined;
    /**
     * Process a simple point symbol using the settings.
     *
     * Simple point symbol may be an icon or a vector symbol.
     *
     * @param styleSettings - Settings to use for the Style creation
     * @param feature - Optional feature. This method does not use it, it is there to have a homogeneous signature
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processSimplePoint(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process a simple lineString using the settings.
     *
     * @param styleSettings - Settings to use for the Style creation
     * @param feature - Optional feature. This method does not use it, it is there to have a homogeneous signature
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processSimpleLineString(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process a simple solid fill (polygon) using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processSolidFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a null fill (polygon with fill opacity = 0) using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processNullFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a pattern fill using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param FillPatternLines - Fill pattern lines needed to create the fill
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processPatternFill(settings: TypePolygonVectorConfig, FillPatternLines: FillPatternLine[], geometry?: Geometry): Style | undefined;
    /**
     * Process a backward diagonal fill using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processBackwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a forward diagonal fill using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processForwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a cross fill using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a diagonal cross fill using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processDiagonalCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a horizontal fill using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processHorizontalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a vertical fill using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processVerticalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a dot fill using the settings.
     *
     * @param settings - Settings to use for the Style creation
     * @param geometry - Optional geometry to associate with the style
     * @returns The Style created, or undefined if unable to create it
     */
    static processDotFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined;
    /**
     * Process a simple polygon using the settings.
     *
     * @param styleSettings - Settings to use for the Style creation
     * @param feature - Optional feature. This method does not use it, it is there to have a homogeneous signature
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processSimplePolygon(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Processes the array of point styles as described in the pointStyleConfig.
     *
     * @param layerStyles - Object that will receive the created canvas
     * @param arrayOfPointStyleConfig - Array of point style configuration
     * @returns A promise that resolves with the vector layer style
     */
    static processArrayOfPointStyleConfig(layerStyles: TypeVectorLayerStyles, arrayOfPointStyleConfig: TypeLayerStyleConfigInfo[]): Promise<TypeVectorLayerStyles>;
    /**
     * Gets the legend styles used by the layer as specified by the style configuration.
     *
     * @param styleConfig - The style configuration
     * @returns A promise that resolves with the layer styles
     */
    static getLegendStyles(styleConfig: TypeLayerStyleConfig | undefined): Promise<TypeVectorLayerStyles>;
    /**
     * Create a default style to use with a vector feature that has no style configuration.
     *
     * @param geometryType - Type of geometry (Point, LineString, Polygon)
     * @param label - Label for the style
     * @returns The Style configuration created, or undefined if unable to create it
     */
    static createDefaultStyle(geometryType: TypeStyleGeometry, label: string): TypeLayerStyleSettings | undefined;
    /**
     * Interpolate a value between two stops linearly.
     *
     * @param value - The data value to interpolate for
     * @param value1 - The lower data value
     * @param value2 - The upper data value
     * @param output1 - The output at the lower value
     * @param output2 - The output at the upper value
     * @returns The interpolated output value
     */
    static interpolateValue(value: number, value1: number, value2: number, output1: number, output2: number): number;
    /**
     * Interpolate a color between two hex colors.
     *
     * @param value - The data value to interpolate for
     * @param value1 - The lower data value
     * @param value2 - The upper data value
     * @param color1 - The hex color at the lower value
     * @param color2 - The hex color at the upper value
     * @returns The interpolated color in rgba format
     */
    static interpolateColor(value: number, value1: number, value2: number, color1: string | number[], color2: string | number[]): string;
    /**
     * Evaluate a simple value expression using feature data.
     *
     * Supports basic arithmetic operations and field references.
     *
     * @param expression - Expression string (e.g., "$feature[\"FIELD_NAME\"] + 90")
     * @param feature - Feature containing field data
     * @returns The evaluated result or null if evaluation fails
     */
    static evaluateValueExpression(expression: string, feature: Feature): number | null;
    /**
     * Search the unique value entry using the field values stored in the feature.
     *
     * @param fields - Fields involved in the unique value definition
     * @param uniqueValueStyleInfo - Unique value configuration
     * @param feature - Optional feature used to test the unique value conditions
     * @param domainsLookup - Optional lookup table to handle coded value domains
     * @param aliasLookup - Optional lookup table to handle field name aliases
     * @returns The Style created, or undefined if unable to create it
     */
    static searchUniqueValueEntry(fields: string[], uniqueValueStyleInfo: TypeLayerStyleConfigInfo[], feature?: Feature, domainsLookup?: TypeLayerMetadataFields[], aliasLookup?: TypeAliasLookup): TypeLayerStyleConfigInfo | undefined;
    /**
     * Process the unique value settings using a point feature to get its Style.
     *
     * @param styleSettings - Style settings to use
     * @param feature - Optional feature used to test the unique value conditions
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processUniqueValuePoint(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process the unique value settings using a lineString feature to get its Style.
     *
     * @param styleSettings - Style settings to use
     * @param feature - Optional feature used to test the unique value conditions
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processUniqueLineString(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process the unique value settings using a polygon feature to get its Style.
     *
     * @param styleSettings - Style settings to use
     * @param feature - Optional feature used to test the unique value conditions
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processUniquePolygon(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Search the class break entry using the field value stored in the feature.
     *
     * @param field - Field involved in the class break definition
     * @param classBreakStyleInfo - Class break configuration
     * @param feature - Feature used to test the class break conditions
     * @param aliasLookup - Optional lookup table to handle field name aliases
     * @returns The matching entry, or undefined if unable to find it
     */
    static searchClassBreakEntry(field: string, classBreakStyleInfo: TypeLayerStyleConfigInfo[], feature: Feature, aliasLookup?: TypeAliasLookup): TypeLayerStyleConfigInfo | undefined;
    /**
     * Check whether a numeric value falls within a class-break interval using provided boundary conditions.
     *
     * The `conditions` parameter is expected to be a two-element array where:
     * - conditions[0] is the lower-bound operator: 'gt' (>) or 'gte' (>=)
     * - conditions[1] is the upper-bound operator: 'lt' (<) or 'lte' (<=)
     * Examples:
     * - ['gte','lte'] => min <= value <= max
     * - ['gt','lte']  => min < value <= max
     *
     * @param value - The numeric value to test
     * @param min - The lower bound of the interval
     * @param max - The upper bound of the interval
     * @param conditions - Two-element array describing the boundary operators
     * @returns True if the value satisfies the interval according to the conditions, false otherwise
     * @throws {NotSupportedError} When `conditions` contains an unsupported combination of operators
     */
    static searchClassBreakEntryCheck(value: number, min: number, max: number, conditions: TypeLayerStyleValueCondition[]): boolean;
    /**
     * Process the class break settings using a Point feature to get its Style.
     *
     * @param styleSettings - Style settings to use
     * @param feature - Optional feature used to test the unique value conditions
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processClassBreaksPoint(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process the class break settings using a lineString feature to get its Style.
     *
     * @param styleSettings - Style settings to use
     * @param feature - Optional feature used to test the unique value conditions
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processClassBreaksLineString(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Process the class break settings using a Polygon feature to get its Style.
     *
     * @param styleSettings - Style settings to use
     * @param feature - Optional feature used to test the unique value conditions
     * @param options - Optional processing options
     * @returns The Style created, or undefined if unable to create it
     */
    static processClassBreaksPolygon(styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings, feature?: Feature, options?: TypeStyleProcessorOptions): Style | undefined;
    /**
     * Gets the style of the feature using the layer entry config.
     *
     * If the style does not exist for the geometryType, create it using the default style strategy.
     *
     * @param feature - Feature that need its style to be defined
     * @param layerStyle - The style to use
     * @param label - The style label when one has to be created
     * @param filterEquation - Optional filter equation associated to the layer
     * @param callbackWhenCreatingStyle - Optional callback to execute when a new style had to be created
     * @returns The style applied to the feature, or undefined if not found
     */
    static getAndCreateFeatureStyle(feature: FeatureLike, layerStyle: TypeLayerStyleConfig, label: string, filterEquation?: FilterNodeType[], callbackWhenCreatingStyle?: (geometryType: TypeStyleGeometry, style: TypeLayerStyleConfigInfo) => void): Style | undefined;
    /**
     * Gets the image source from the style of the feature using the layer entry config.
     *
     * @param style - The style to use
     * @param geometryType - The type of geometry
     * @param styleSettings - The layer style settings
     * @returns The icon source associated to the feature, or undefined
     */
    static getFeatureIconSource(style: Style | undefined, geometryType: TypeStyleGeometry, styleSettings: TypeLayerStyleSettings | undefined): string | undefined;
    /**
     * Classify the remaining nodes to complete the classification.
     *
     * The plus and minus can be a unary or a binary operator. It is
     * only at the end that we can determine their node type. Nodes that start with a number are numbers, otherwise they are
     * variables. If a problem is detected, an error object is thrown with an explanatory message.
     *
     * @param keywordArray - Array of keywords to process
     * @returns The new keywords array with all nodes classified
     */
    static classifyUnprocessedNodes(keywordArray: FilterNodeType[]): FilterNodeType[];
    /**
     * Extract the specified keyword and associate a node type to their nodes.
     *
     * In some cases, the extraction uses an optional regular expression.
     *
     * @param filterNodeArray - Array of keywords to process
     * @param keyword - Keyword to extract
     * @param regExp - Optional regular expression to use for the extraction
     * @returns The new keywords array
     */
    static extractKeyword(filterNodeArray: FilterNodeType[], keyword: string, regExp?: RegExp): FilterNodeType[];
    /**
     * Extract the string nodes from the keyword array.
     *
     * This operation is done at the beginning of the classification. This allows
     * to consider keywords in a string as a normal word. If a problem is detected, an error object is thrown with an explanatory
     * message.
     *
     * @param keywordArray - Array of keywords to process
     * @returns The new keywords array with all string nodes classified
     */
    static extractStrings(keywordArray: FilterNodeType[]): FilterNodeType[];
    /**
     * Creates a filter equation from a filter string.
     *
     * @param filter - The filter string to convert
     * @returns The filter equation as an array of FilterNodeType
     */
    static createFilterNodeFromFilter(filter: string): FilterNodeType[];
    /**
     * Analyse the filter and split it in syntactic nodes.
     *
     * @param filterNodeArrayType - Node array to analyse
     * @returns The new node array with all nodes classified
     * @throws {Error} When the filter contains unbalanced parentheses or unclosed strings
     */
    static analyzeLayerFilter(filterNodeArrayType: FilterNodeType[]): FilterNodeType[];
    /** Table used to define line symbology to use when drawing lineString and polygon perimeters */
    static lineDashSettings: Record<TypeLineStyle, number[] | undefined>;
    /** Table used to define line symbology to use when drawing polygon fill */
    static FillPatternSettings: FillPatternSettings;
    /** Table of function to process the style settings based on the feature geometry and the kind of style settings. */
    static processStyle: Record<TypeLayerStyleConfigType, Record<TypeStyleGeometry, TypeStyleProcessor>>;
    /**
     * Builds a filter string (SQL-like or OGC-compliant) for a given layer and style configuration.
     *
     * This method supports:
     * - simple styles: returns the base layer filter or a default `(1=1)` condition.
     * - unique value styles: builds an optimized filter for visible categories.
     * - class breaks styles: builds numeric range filters based on visibility flags.
     *
     * @param outFields - The outfields information
     * @param style - The style configuration (optional)
     * @param styleSettings - The layer style settings
     * @returns The filter expression, or undefined if not applicable
     */
    static getFilterFromStyle(outFields: TypeOutfields[] | undefined, style: TypeLayerStyleConfig | undefined, styleSettings: TypeLayerStyleSettings | undefined): string | undefined;
}
export type TypeStyleRepresentation = {
    /** The defaultCanvas property is used by Simple styles and default styles when defined in unique value and class
     * break styles.
     */
    defaultCanvas?: HTMLCanvasElement | null;
    /** The arrayOfCanvas property is used by unique value and class break styles. */
    arrayOfCanvas?: (HTMLCanvasElement | null)[];
};
export type TypeVectorLayerStyles = Partial<Record<TypeStyleGeometry, TypeStyleRepresentation>>;
export {};
//# sourceMappingURL=geoview-renderer.d.ts.map