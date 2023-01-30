import { Style } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { TypeVectorLayerEntryConfig, TypeVectorTileLayerEntryConfig, TypeBaseLayerEntryConfig, TypeStyleConfig } from '../map/map-schema-types';
import { TypeLayerStyle } from '../layer/geoview-layers/abstract-geoview-layers';
/** *****************************************************************************************************************************
 * A class to define the GeoView renderers.
 *
 * @exports
 * @class GeoviewRenderer
 */
export declare class GeoviewRenderer {
    private mapId;
    /** index used to select the default styles */
    private defaultColorIndex;
    /** Table used to define line symbology to use when drawing lineString and polygon perimeters */
    private lineDashSettings;
    /** Table of function to process the style settings based on the feature geometry and the kind of style settings. */
    private processStyle;
    /** Table of function to process simpleSymbol settings. */
    private processSymbol;
    /** Table of function to process polygon fill style settings. */
    private processFillStyle;
    /** Table used to define line symbology to use when drawing polygon fill */
    private fillPaternSettings;
    /** Default value of the legend canvas width when the settings do not provide one. */
    private LEGEND_CANVAS_WIDTH;
    /** Default value of the legend canvas height when the settings do not provide one. */
    private LEGEND_CANVAS_HEIGHT;
    /** ***************************************************************************************************************************
     * The class constructor saves parameters in attributes and initialize the default color index of the class.
     *
     * @param {string} mapId The identifier of the map that uses the geoview renderer instance.
     */
    constructor(mapId: string);
    /** ***************************************************************************************************************************
     * This method loads the image of an icon that compose the legend.
     *
     * @param {string} src The source information (base64 image) of the image to load.
     *
     * @returns {Promise<HTMLImageElement>} A promise that the image is loaded.
     */
    loadImage(src: string): Promise<HTMLImageElement | null>;
    /** ***************************************************************************************************************************
     * This method creates a canvas with the image of an icon that is defined in the point style.
     *
     * @param {Style} pointStyle The style associated to the point symbol.
     *
     * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
     */
    private createIconCanvas;
    /** ***************************************************************************************************************************
     * This method creates a canvas with the vector point settings that are defined in the point style.
     *
     * @param {Style} pointStyle The style associated to the point symbol.
     *
     * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
     */
    private createPointCanvas;
    /** ***************************************************************************************************************************
     * This method creates a canvas with the lineString settings that are defined in the style.
     *
     * @param {Style} lineStringStyle The style associated to the lineString.
     *
     * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
     */
    private createLineStringCanvas;
    /** ***************************************************************************************************************************
     * This method creates a canvas with the polygon settings that are defined in the style.
     *
     * @param {Style} polygonStyle The style associated to the polygon.
     *
     * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
     */
    private createPolygonCanvas;
    /** ***************************************************************************************************************************
     * This method is used to process the array of point styles as described in the pointStyleConfig.
     *
     * @param {TypeLayerStyle} layerStyle The object that will receive the created canvas.
     * @param {TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[]} arrayOfPointStyleConfig The array of point style
     * configuration.
     * @param {(value: TypeLayerStyle | PromiseLike<TypeLayerStyle>) => void} resolve The function that will resolve the promise
     * of the calling methode.
     */
    private processArrayOfPointStyleConfig;
    /** ***************************************************************************************************************************
     * This method is a private sub routine used by the getStyle method to gets the style of the layer as specified by the style
     * configuration.
     *
     * @param {TypeLayerStyle} layerStyle The object that will receive the created canvas.
     * @param {TypeKindOfVectorSettings | undefined} defaultSettings The settings associated to simple styles or default style of
     * unique value and class break styles. When this parameter is undefined, no defaultCanvas is created.
     * @param {TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[] | undefined} arrayOfPointStyleConfig The array of point style
     * configuration associated to unique value and class break styles. When this parameter is undefined, no arrayOfCanvas is
     * created.
     * @param {(value: TypeLayerStyle | PromiseLike<TypeLayerStyle>) => void} resolve The function that will resolve the promise
     */
    private getPointStyleSubRoutine;
    /** ***************************************************************************************************************************
     * This method gets the point style of the layer as specified by the style configuration.
     *
     * @param {TypeStyleConfig} styleConfig The style configuration associated to the layer.
     *
     * @returns {Promise<TypeLayerStyle>} A promise that the layer style is processed.
     */
    getStyle(styleConfig: TypeStyleConfig): Promise<TypeLayerStyle>;
    /** ***************************************************************************************************************************
     * This method gets the style of the feature using the layer entry config. If the style does not exist for the geometryType,
     * create it using the default style strategy.
     *
     * @param {FeatureLike} feature The feature that need its style to be defined.
     * @param {TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig} layerEntryConfig The layer
     * entry config that may have a style configuration for the feature. If style does not exist for the geometryType, create it.
     *
     * @returns {Style | undefined} The style applied to the feature or undefined if not found.
     */
    getFeatureStyle(feature: FeatureLike, layerEntryConfig: TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig): Style | undefined;
    /** ***************************************************************************************************************************
     * This method gets the style of the cluster feature using the layer entry config. If the style does not exist, create it using
     * the default style strategy.
     *
     * @param {FeatureLike} feature The feature that need its style to be defined.
     * @param {TypeBaseLayerEntryConfig | TypeVectorLayerEntryConfig} layerEntryConfig The layer
     * entry config that may have a style configuration for the feature. If style does not exist for the geometryType, create it.
     *
     * @returns {Style | undefined} The style applied to the feature or undefined if not found.
     */
    getClusterStyle(feature: FeatureLike, layerEntryConfig: TypeVectorLayerEntryConfig): Style | undefined;
    /** ***************************************************************************************************************************
     * Create a default style to use with a cluster feature that has no style configuration.
     *
     * @param { TypeVectorLayerEntryConfig} layerEntryConfig The layer entry config that may have a style configuration for the
     * feature. If style does not exist for the geometryType, create it.
     *
     * @returns {TypeStyleConfig} The style applied to the feature.
     */
    private createDefaultClusterStyle;
    /** ***************************************************************************************************************************
     * Set the color in the layer cluster settings for clustered elements.
     *
     * @param { TypeVectorLayerEntryConfig} layerEntryConfig The layer entry config for the layer.
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the circle Style creation.
     *
     */
    private setClusterColor;
    /** ***************************************************************************************************************************
     * Increment the default color index.
     */
    private incrementDefaultColorIndex;
    /** ***************************************************************************************************************************
     * Get the default color using the default color index an increment it to select the next color the next time.
     *
     * @param {number} alpha The alpha value to associate to the color.
     *
     * @returns {string} The current default color string.
     */
    private getDefaultColorAndIncrementIndex;
    /** ***************************************************************************************************************************
     * Get the default color using the default color index.
     *
     * @param {number} alpha The alpha value to associate to the color.
     *
     * @returns {string} The current default color string.
     */
    private getDefaultColor;
    /** ***************************************************************************************************************************
     * Create the stroke options using the specified settings.
     *
     * @param {TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig} settings The settings to use
     * for the stroke options creation.
     *
     * @returns {StrokeOptions} The stroke options created.
     */
    private createStrokeOptions;
    /** ***************************************************************************************************************************
     * Process a circle symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processCircleSymbol;
    /** ***************************************************************************************************************************
     * Process a star shape symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     * @param {number} points The number of points needed to create the symbol.
     * @param {number} angle The angle to use for the symbol creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processStarShapeSymbol;
    /** ***************************************************************************************************************************
     * Process a star symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processStarSymbol;
    /** ***************************************************************************************************************************
     * Process a X symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processXSymbol;
    /** ***************************************************************************************************************************
     * Process a + symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processPlusSymbol;
    /** ***************************************************************************************************************************
     * Process a regular shape using the settings, the number of points, the angle and the scale.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     * @param {number} points The number of points needed to create the symbol.
     * @param {number} angle The angle to use for the symbol creation.
     * @param {[number, number]} scale The scale to use for the symbol creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processRegularShape;
    /** ***************************************************************************************************************************
     * Process a square symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processSquareSymbol;
    /** ***************************************************************************************************************************
     * Process a Diamond symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processDiamondSymbol;
    /** ***************************************************************************************************************************
     * Process a triangle symbol using the settings.
     *
     * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processTriangleSymbol;
    /** ***************************************************************************************************************************
     * Process an icon symbol using the settings.
     *
     * @param {TypeIconSymbolVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processIconSymbol;
    /** ***************************************************************************************************************************
     * Process a cluster circle symbol using the settings.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the circle Style creation.
     * @param {FeatureLike} feature The feature that need its style to be defined.
     * @param {string} textColor The color to use for the cluster feature count.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processClusterSymbol;
    /** ***************************************************************************************************************************
     * Process a simple point symbol using the settings. Simple point symbol may be an icon or a vector symbol.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the Style creation.
     * @param {FeatureLike} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processSimplePoint;
    /** ***************************************************************************************************************************
     * Process a simple lineString using the settings.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the Style creation.
     * @param {FeatureLike} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processSimpleLineString;
    /** ***************************************************************************************************************************
     * Process a simple solid fill (polygon) using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processSolidFill;
    /** ***************************************************************************************************************************
     * Process a null fill (polygon with fill opacity = 0) using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processNullFill;
    /** ***************************************************************************************************************************
     * Process a pattern fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     * @param {FillPaternLine[]} fillPaternLines The fill patern lines needed to create the fill.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processPaternFill;
    /** ***************************************************************************************************************************
     * Process a backward diagonal fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processBackwardDiagonalFill;
    /** ***************************************************************************************************************************
     * Process a forward diagonal fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processForwardDiagonalFill;
    /** ***************************************************************************************************************************
     * Process a cross fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processCrossFill;
    /** ***************************************************************************************************************************
     * Process a diagonal cross fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processDiagonalCrossFill;
    /** ***************************************************************************************************************************
     * Process a horizontal fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processHorizontalFill;
    /** ***************************************************************************************************************************
     * Process a vertical fill using the settings.
     *
     * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processVerticalFill;
    /** ***************************************************************************************************************************
     * Process a simple polygon using the settings.
     *
     * @param {TypePolTypeStyleSettings | TypeKindOfVectorSettingsygonVectorConfig} styleSettings The settings to use for the
     * Style creation.
     * @param {FeatureLike} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processSimplePolygon;
    /** ***************************************************************************************************************************
     * Search the unique value entry using the field values stored in the feature.
     *
     * @param {string[]} fields The fields involved in the unique value definition.
     * @param {TypeUniqueValueStyleInfo[]} uniqueValueStyleInfo The unique value configuration.
     * @param {FeatureLike} feature The feature used to test the unique value conditions.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private searchUniqueValueEntry;
    /** ***************************************************************************************************************************
     * Process the unique value settings using a point feature to get its Style.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
     * @param {FeatureLike} feature the feature used to test the unique value conditions.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processUniqueValuePoint;
    /** ***************************************************************************************************************************
     * Process the unique value settings using a lineString feature to get its Style.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
     * @param {FeatureLike} feature the feature used to test the unique value conditions.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processUniqueLineString;
    /** ***************************************************************************************************************************
     * Process the unique value settings using a polygon feature to get its Style.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
     * @param {FeatureLike} feature the feature used to test the unique value conditions.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processUniquePolygon;
    /** ***************************************************************************************************************************
     * Search the class breakentry using the field value stored in the feature.
     *
     * @param {string[]} field The field involved in the class break definition.
     * @param {TypeClassBreakStyleInfo[]} classBreakStyleInfo The class break configuration.
     * @param {FeatureLike} feature The feature used to test the class break conditions.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private searchClassBreakEntry;
    /** ***************************************************************************************************************************
     * Process the class break settings using a Point feature to get its Style.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
     * @param {FeatureLike} feature the feature used to test the unique value conditions.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processClassBreaksPoint;
    /** ***************************************************************************************************************************
     * Process the class break settings using a lineString feature to get its Style.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
     * @param {FeatureLike} feature the feature used to test the unique value conditions.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processClassBreaksLineString;
    /** ***************************************************************************************************************************
     * Process the class break settings using a Polygon feature to get its Style.
     *
     * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
     * @param {FeatureLike} feature the feature used to test the unique value conditions.
     *
     * @returns {Style | undefined} The Style created. Undefined if unable to create it.
     */
    private processClassBreaksPolygon;
    /** ***************************************************************************************************************************
     * Create a default style to use with a vector feature that has no style configuration.
     *
     * @param {TypeStyleGeometry} geometryType The type of geometry (Point, LineString, Polygon).
     * @param {TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig} layerEntryConfig the layer entry config to configure.
     *
     * @returns {TypeStyleConfig | undefined} The Style configurationcreated. Undefined if unable to create it.
     */
    private createDefaultStyle;
}
