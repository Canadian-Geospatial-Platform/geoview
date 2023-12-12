/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import { asArray, asString } from 'ol/color';
import { Text, Style, Stroke, Fill, RegularShape, Circle as StyleCircle, Icon as StyleIcon } from 'ol/style';
import { Geometry, LineString, MultiLineString, Point, MultiPoint, Polygon, MultiPolygon } from 'ol/geom';
import Icon, { Options as IconOptions } from 'ol/style/Icon';
import { Options as CircleOptions } from 'ol/style/Circle';
import { Options as RegularShapeOptions } from 'ol/style/RegularShape';
import { Options as StrokeOptions } from 'ol/style/Stroke';
import { Options as FillOptions } from 'ol/style/Fill';
import { Options as TextOptions } from 'ol/style/Text';
import Feature from 'ol/Feature';
import { toContext } from 'ol/render';
import { Size } from 'ol/size';

import { getLocalizedValue, setAlphaColor } from '@/core/utils/utilities';
import {
  isFilledPolygonVectorConfig,
  isIconSymbolVectorConfig,
  isLineStringVectorConfig,
  isSimpleSymbolVectorConfig,
  TypeBaseStyleType,
  TypeClassBreakStyleInfo,
  TypeFillStyle,
  TypePolygonVectorConfig,
  TypeIconSymbolVectorConfig,
  TypeLineStyle,
  TypeLineStringVectorConfig,
  TypeSimpleStyleConfig,
  TypeSimpleSymbolVectorConfig,
  TypeStyleGeometry,
  TypeStyleSettings,
  TypeSymbol,
  TypeUniqueValueStyleInfo,
  TypeVectorLayerEntryConfig,
  TypeVectorTileLayerEntryConfig,
  TypeBaseLayerEntryConfig,
  TypeStyleConfig,
  TypeKindOfVectorSettings,
  isSimpleStyleConfig,
  isUniqueValueStyleConfig,
  isClassBreakStyleConfig,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
  TypeBaseSourceVectorInitialConfig,
  layerEntryIsVector,
} from '../map/map-schema-types';
import {
  binaryKeywors,
  defaultColor,
  FillPaternLine,
  FillPaternSettings,
  FilterNodeArrayType,
  FilterNodeType,
  groupKeywords,
  NodeType,
  operatorPriority,
  unaryKeywords,
} from './geoview-renderer-types';
import { Layer } from '../layer/layer';
import { TypeVectorLayerStyles } from '../layer/geoview-layers/abstract-geoview-layers';
import { api } from '@/app';

type TypeStyleProcessor = (
  styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeArrayType,
  legendFilterIsOff?: boolean
) => Style | undefined;

/** ***************************************************************************************************************************
 * This method returns the type of geometry. It removes the Multi prefix because for the geoviewRenderer, a MultiPoint has
 * the same behaviour than a Point.
 *
 * @param {Feature} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
 *
 * @returns {TypeStyleGeometry} The type of geometry (Point, LineString, Polygon).
 */
const getGeometryType = (feature: Feature): TypeStyleGeometry => {
  const geometryType = feature.getGeometry()?.getType();
  if (!geometryType) throw new Error('Features must have a geometry type.');
  return (geometryType.startsWith('Multi') ? geometryType.slice(5) : geometryType) as TypeStyleGeometry;
};

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to define the GeoView renderers.
 *
 * @exports
 * @class GeoviewRenderer
 */
// ******************************************************************************************************************************
export class GeoviewRenderer {
  // the id of the map
  private mapId!: string;

  /** index used to select the default styles */
  private defaultColorIndex: number;

  /** Table used to define line symbology to use when drawing lineString and polygon perimeters */
  private lineDashSettings: Record<TypeLineStyle, number[] | undefined> = {
    dash: [16, 4],
    'dash-dot': [16, 4, 2, 4],
    'dash-dot-dot': [16, 4, 2, 4, 2, 4],
    dot: [2, 2],
    longDash: [25, 5],
    'longDash-dot': [25, 5, 2, 5],
    null: [0, 3],
    shortDash: [7, 3],
    'shortDash-dot': [7, 3, 2, 3],
    'shortDash-dot-dot': [7, 3, 2, 3, 2, 3],
    solid: undefined,
  };

  /** Table of function to process the style settings based on the feature geometry and the kind of style settings. */
  private processStyle: Record<TypeBaseStyleType, Record<TypeStyleGeometry, TypeStyleProcessor>> = {
    simple: {
      Point: this.processSimplePoint,
      LineString: this.processSimpleLineString,
      Polygon: this.processSimplePolygon,
    },
    uniqueValue: {
      Point: this.processUniqueValuePoint,
      LineString: this.processUniqueLineString,
      Polygon: this.processUniquePolygon,
    },
    classBreaks: {
      Point: this.processClassBreaksPoint,
      LineString: this.processClassBreaksLineString,
      Polygon: this.processClassBreaksPolygon,
    },
  };

  /** Table of function to process simpleSymbol settings. */
  private processSymbol: Record<TypeSymbol, (settings: TypeSimpleSymbolVectorConfig) => Style | undefined> = {
    circle: this.processCircleSymbol,
    '+': this.processPlusSymbol,
    diamond: this.processDiamondSymbol,
    square: this.processSquareSymbol,
    triangle: this.processTriangleSymbol,
    X: this.processXSymbol,
    star: this.processStarSymbol,
  };

  /** Table of function to process polygon fill style settings. */
  private processFillStyle: Record<TypeFillStyle, (settings: TypePolygonVectorConfig, geometry?: Geometry) => Style | undefined> = {
    null: this.processNullFill,
    solid: this.processSolidFill,
    backwardDiagonal: this.processBackwardDiagonalFill,
    cross: this.processCrossFill,
    diagonalCross: this.processDiagonalCrossFill,
    forwardDiagonal: this.processForwardDiagonalFill,
    horizontal: this.processHorizontalFill,
    vertical: this.processVerticalFill,
  };

  /** Table used to define line symbology to use when drawing polygon fill */
  private fillPaternSettings: FillPaternSettings = {
    null: [],
    solid: [],
    backwardDiagonal: [
      { moveTo: [1, 0], lineTo: [2, 1] },
      { moveTo: [0, 0], lineTo: [2, 2] },
      { moveTo: [0, 1], lineTo: [1, 2] },
    ],
    cross: [
      { moveTo: [1, 0], lineTo: [1, 2] },
      { moveTo: [0, 1], lineTo: [2, 1] },
    ],
    diagonalCross: [
      { moveTo: [0, 0], lineTo: [2, 2] },
      { moveTo: [0, 2], lineTo: [2, 0] },
    ],
    forwardDiagonal: [
      { moveTo: [0, 1], lineTo: [1, 0] },
      { moveTo: [0, 2], lineTo: [2, 0] },
      { moveTo: [2, 1], lineTo: [1, 2] },
    ],
    horizontal: [{ moveTo: [0, 1], lineTo: [2, 1] }],
    vertical: [{ moveTo: [1, 0], lineTo: [1, 2] }],
  };

  // ******************************************************************************************************************************
  /** Default value of the legend canvas width when the settings do not provide one. */
  private LEGEND_CANVAS_WIDTH = 50;

  /** Default value of the legend canvas height when the settings do not provide one. */
  private LEGEND_CANVAS_HEIGHT = 50;

  /** ***************************************************************************************************************************
   * The class constructor saves parameters in attributes and initialize the default color index of the class.
   *
   * @param {string} mapId The identifier of the map that uses the geoview renderer instance.
   */
  constructor(mapId: string) {
    this.mapId = mapId;
    this.defaultColorIndex = 0;
  }

  /** ***************************************************************************************************************************
   * This method loads the image of an icon that compose the legend.
   *
   * @param {string} src The source information (base64 image) of the image to load.
   *
   * @returns {Promise<HTMLImageElement>} A promise that the image is loaded.
   */
  loadImage(src: string): Promise<HTMLImageElement | null> {
    const promisedImage = new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.src = src;
      image
        .decode()
        .then(() => resolve(image))
        .catch((reason) => {
          // eslint-disable-next-line no-console
          console.log('GeoviewRenderer.loadImage(src) - Error while loading the src image =', src);
          resolve(null);
        });
    });
    return promisedImage;
  }

  /** ***************************************************************************************************************************
   * This method creates a canvas with the image of an icon that is defined in the point style.
   *
   * @param {Style} pointStyle The style associated to the point symbol.
   *
   * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
   */
  private createIconCanvas(pointStyle?: Style): Promise<HTMLCanvasElement | null> {
    const promisedCanvas = new Promise<HTMLCanvasElement | null>((resolve) => {
      const iconStyle = pointStyle?.getImage() as Icon;
      this.loadImage(iconStyle.getSrc()!).then((image) => {
        if (image) {
          const size = iconStyle.getSize() as Size;
          const width = Array.isArray(size) ? size[0] : image.width || this.LEGEND_CANVAS_WIDTH;
          const height = Array.isArray(size) ? size[1] : image.height || this.LEGEND_CANVAS_HEIGHT;
          const drawingCanvas = document.createElement('canvas');
          drawingCanvas.width = width;
          drawingCanvas.height = height;
          const drawingContext = drawingCanvas.getContext('2d')!;
          drawingContext.globalAlpha = iconStyle.getOpacity();
          drawingContext.drawImage(image, 0, 0);
          resolve(drawingCanvas);
        } else resolve(null);
      });
    });
    return promisedCanvas;
  }

  /** ***************************************************************************************************************************
   * This method creates a canvas with the vector point settings that are defined in the point style.
   *
   * @param {Style} pointStyle The style associated to the point symbol.
   *
   * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
   */
  private createPointCanvas(pointStyle?: Style): HTMLCanvasElement {
    const size = pointStyle!.getImage()!.getSize() as Size;
    const [width, height] = Array.isArray(size) ? size : [this.LEGEND_CANVAS_WIDTH, this.LEGEND_CANVAS_HEIGHT];
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = width + 4;
    drawingCanvas.height = height + 4;
    const drawingContext = toContext(drawingCanvas.getContext('2d')!);
    drawingContext.setStyle(pointStyle!);
    drawingContext.setTransform([1, 0, 0, 1, 0, 0]);
    drawingContext.drawGeometry(new Point([drawingCanvas.width / 2, drawingCanvas.width / 2]));
    return drawingCanvas;
  }

  /** ***************************************************************************************************************************
   * This method creates a canvas with the lineString settings that are defined in the style.
   *
   * @param {Style} lineStringStyle The style associated to the lineString.
   *
   * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
   */
  private createLineStringCanvas(lineStringStyle?: Style): HTMLCanvasElement {
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = this.LEGEND_CANVAS_WIDTH;
    drawingCanvas.height = this.LEGEND_CANVAS_HEIGHT;
    const context = drawingCanvas.getContext('2d')!;
    const gradient = context.createLinearGradient(0, drawingCanvas.height, drawingCanvas.width, 0);
    gradient.addColorStop(0, '#7f7f7f');
    gradient.addColorStop(0.667, '#ffffff');
    gradient.addColorStop(1, '#ffffff');
    context.fillStyle = gradient;
    context.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    const drawingContext = toContext(context);
    drawingContext.setStyle(lineStringStyle!);
    drawingContext.setTransform([1, 0, 0, 1, 0, 0]);
    drawingContext.drawGeometry(
      new LineString([
        [4, drawingCanvas.height - 4],
        [drawingCanvas.width - 4, 4],
      ])
    );
    return drawingCanvas;
  }

  /** ***************************************************************************************************************************
   * This method creates a canvas with the polygon settings that are defined in the style.
   *
   * @param {Style} polygonStyle The style associated to the polygon.
   *
   * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
   */
  private createPolygonCanvas(polygonStyle?: Style): HTMLCanvasElement {
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = this.LEGEND_CANVAS_WIDTH;
    drawingCanvas.height = this.LEGEND_CANVAS_HEIGHT;
    const context = drawingCanvas.getContext('2d')!;
    const gradient = context.createLinearGradient(0, drawingCanvas.height, drawingCanvas.width, 0);
    gradient.addColorStop(0, '#7f7f7f');
    gradient.addColorStop(0.667, '#ffffff');
    gradient.addColorStop(1, '#ffffff');
    context.fillStyle = gradient;
    context.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    const drawingContext = toContext(context);
    drawingContext.setStyle(polygonStyle!);
    drawingContext.setTransform([1, 0, 0, 1, 0, 0]);
    drawingContext.drawGeometry(
      new Polygon([
        [
          [4, 4],
          [drawingCanvas.width - 4, 4],
          [drawingCanvas.width - 4, drawingCanvas.height - 4],
          [4, drawingCanvas.height - 4],
          [4, 4],
        ],
      ])
    );
    const test = context.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
    return drawingCanvas;
  }

  /** ***************************************************************************************************************************
   * This method is used to process the array of point styles as described in the pointStyleConfig.
   *
   * @param {TypeVectorLayerStyles} layerStyle The object that will receive the created canvas.
   * @param {TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[]} arrayOfPointStyleConfig The array of point style
   * configuration.
   * @param {(value: TypeVectorLayerStyles | PromiseLike<TypeVectorLayerStyles>) => void} resolve The function that will resolve the promise
   * of the calling methode.
   */
  private processArrayOfPointStyleConfig(
    layerStyles: TypeVectorLayerStyles,
    arrayOfPointStyleConfig: TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[],
    resolve: (value: TypeVectorLayerStyles | PromiseLike<TypeVectorLayerStyles>) => void
  ) {
    // UniqueValue or ClassBreak point style configuration ============================================================
    const styleArray: (HTMLCanvasElement | null)[] = layerStyles.Point!.arrayOfCanvas!;
    const promiseOfCanvasCreated: Promise<HTMLCanvasElement | null>[] = [];
    for (let i = 0; i < arrayOfPointStyleConfig.length; i++) {
      if (isIconSymbolVectorConfig(arrayOfPointStyleConfig[i].settings))
        // Icon symbol ================================================================================================
        promiseOfCanvasCreated.push(this.createIconCanvas(this.processSimplePoint(arrayOfPointStyleConfig[i].settings)));
      // Simple vector symbol =======================================================================================
      else
        promiseOfCanvasCreated.push(
          new Promise<HTMLCanvasElement | null>((resolveSimpleVectorSymbol) => {
            resolveSimpleVectorSymbol(this.createPointCanvas(this.processSimplePoint(arrayOfPointStyleConfig[i].settings)));
          })
        );
    }
    Promise.all(promiseOfCanvasCreated).then((listOfCanvasCreated) => {
      listOfCanvasCreated.forEach((canvas) => {
        styleArray.push(canvas);
      });
      resolve(layerStyles);
    });
  }

  /** ***************************************************************************************************************************
   * This method is a private sub routine used by the getLegendStyles method to gets the style of the layer as specified by the
   * style configuration.
   *
   * @param {TypeKindOfVectorSettings | undefined} defaultSettings The settings associated to simple styles or default style of
   * unique value and class break styles. When this parameter is undefined, no defaultCanvas is created.
   * @param {TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[] | undefined} arrayOfPointStyleConfig The array of point style
   * configuration associated to unique value and class break styles. When this parameter is undefined, no arrayOfCanvas is
   * created.
   *
   * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
   */
  private getPointStyleSubRoutine(
    defaultSettings?: TypeKindOfVectorSettings,
    arrayOfPointStyleConfig?: TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[]
  ): Promise<TypeVectorLayerStyles> {
    const promisedLayerStyle = new Promise<TypeVectorLayerStyles>((resolve) => {
      const layerStyles: TypeVectorLayerStyles = { Point: {} };
      if (defaultSettings) {
        if (isIconSymbolVectorConfig(defaultSettings)) {
          // Icon symbol ======================================================================================
          this.createIconCanvas(this.processSimplePoint(defaultSettings)).then((canvas) => {
            layerStyles.Point!.defaultCanvas = canvas;
            if (arrayOfPointStyleConfig) {
              layerStyles.Point!.arrayOfCanvas = [];
              this.processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig, resolve);
            } else resolve(layerStyles);
          });
        } else {
          // Simple vector symbol =============================================================================
          layerStyles.Point!.defaultCanvas = this.createPointCanvas(this.processSimplePoint(defaultSettings));
          if (arrayOfPointStyleConfig) {
            layerStyles.Point!.arrayOfCanvas = [];
            this.processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig, resolve);
          } else resolve(layerStyles);
        }
      } else {
        layerStyles.Point!.arrayOfCanvas = [];
        this.processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig!, resolve);
      }
    });
    return promisedLayerStyle;
  }

  /** ***************************************************************************************************************************
   * This method gets the legend styles used by the the layer as specified by the style configuration.
   *
   * @param {TypeBaseLayerEntryConfig & {style: TypeStyleConfig;}} layerConfig The layer configuration.
   *
   * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
   */
  async getLegendStyles(
    layerConfig: TypeBaseLayerEntryConfig & {
      style: TypeStyleConfig;
    }
  ): Promise<TypeVectorLayerStyles> {
    try {
      const styleConfig: TypeStyleConfig = layerConfig.style;
      if (!styleConfig) return {};

      if (styleConfig.Point) {
        // ======================================================================================================================
        // Point style configuration ============================================================================================
        if (isSimpleStyleConfig(styleConfig.Point)) {
          const layerStyles = await this.getPointStyleSubRoutine(styleConfig.Point.settings);
          return layerStyles;
        }

        if (isUniqueValueStyleConfig(styleConfig.Point)) {
          const layerStyles = await this.getPointStyleSubRoutine(
            styleConfig.Point.defaultSettings,
            (styleConfig.Point as TypeUniqueValueStyleConfig).uniqueValueStyleInfo
          );
          return layerStyles;
        }

        if (isClassBreakStyleConfig(styleConfig.Point)) {
          const layerStyles = await this.getPointStyleSubRoutine(
            styleConfig.Point.defaultSettings,
            (styleConfig.Point as TypeClassBreakStyleConfig).classBreakStyleInfo
          );
          return layerStyles;
        }
      }

      if (styleConfig.LineString) {
        // ======================================================================================================================
        // LineString style configuration =======================================================================================
        const layerStyles: TypeVectorLayerStyles = { LineString: {} };
        if (isSimpleStyleConfig(styleConfig.LineString)) {
          layerStyles.LineString!.defaultCanvas = this.createLineStringCanvas(this.processSimpleLineString(styleConfig.LineString));
        } else if (isUniqueValueStyleConfig(styleConfig.LineString)) {
          if (styleConfig.LineString.defaultSettings)
            layerStyles.LineString!.defaultCanvas = this.createLineStringCanvas(
              this.processSimpleLineString(styleConfig.LineString.defaultSettings)
            );
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.LineString.uniqueValueStyleInfo.forEach((styleInfo) => {
            styleArray.push(this.createLineStringCanvas(this.processSimpleLineString(styleInfo.settings)));
          });
          layerStyles.LineString!.arrayOfCanvas = styleArray;
        } else if (isClassBreakStyleConfig(styleConfig.LineString)) {
          if (styleConfig.LineString.defaultSettings)
            layerStyles.LineString!.defaultCanvas = this.createLineStringCanvas(
              this.processSimpleLineString(styleConfig.LineString.defaultSettings)
            );
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.LineString.classBreakStyleInfo.forEach((styleInfo) => {
            styleArray.push(this.createLineStringCanvas(this.processSimpleLineString(styleInfo.settings)));
          });
          layerStyles.LineString!.arrayOfCanvas = styleArray;
        }
        return layerStyles;
      }

      if (styleConfig.Polygon) {
        // ======================================================================================================================
        // Polygon style configuration ==========================================================================================
        const layerStyles: TypeVectorLayerStyles = { Polygon: {} };
        if (isSimpleStyleConfig(styleConfig.Polygon)) {
          layerStyles.Polygon!.defaultCanvas = this.createPolygonCanvas(this.processSimplePolygon(styleConfig.Polygon));
        } else if (isUniqueValueStyleConfig(styleConfig.Polygon)) {
          if (styleConfig.Polygon.defaultSettings)
            layerStyles.Polygon!.defaultCanvas = this.createPolygonCanvas(this.processSimplePolygon(styleConfig.Polygon.defaultSettings));
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.Polygon.uniqueValueStyleInfo.forEach((styleInfo) => {
            styleArray.push(this.createPolygonCanvas(this.processSimplePolygon(styleInfo.settings)));
          });
          layerStyles.Polygon!.arrayOfCanvas = styleArray;
        } else if (isClassBreakStyleConfig(styleConfig.Polygon)) {
          if (styleConfig.Polygon.defaultSettings)
            layerStyles.Polygon!.defaultCanvas = this.createPolygonCanvas(this.processSimplePolygon(styleConfig.Polygon.defaultSettings));
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.Polygon.classBreakStyleInfo.forEach((styleInfo) => {
            styleArray.push(this.createPolygonCanvas(this.processSimplePolygon(styleInfo.settings)));
          });
          layerStyles.Polygon!.arrayOfCanvas = styleArray;
        }
        return layerStyles;
      }
    } catch (error) {
      return {};
    }
    return {};
  }

  /** ***************************************************************************************************************************
   * This method gets the style of the feature using the layer entry config. If the style does not exist for the geometryType,
   * create it using the default style strategy.
   *
   * @param {Feature} feature The feature that need its style to be defined.
   * @param {TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig} layerConfig The layer
   * entry config that may have a style configuration for the feature. If style does not exist for the geometryType, create it.
   *
   * @returns {Style | undefined} The style applied to the feature or undefined if not found.
   */
  getFeatureStyle(
    feature: Feature,
    layerConfig: TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
  ): Style | undefined {
    const geometryType = getGeometryType(feature);
    // If style does not exist for the geometryType, create it.
    let { style } = layerConfig as TypeVectorLayerEntryConfig;
    if (style === undefined || style[geometryType] === undefined)
      style = this.createDefaultStyle(geometryType, layerConfig as TypeVectorLayerEntryConfig);
    // Get the style accordingly to its type and geometry.
    if (style![geometryType] !== undefined) {
      const styleSettings = style![geometryType]!;
      const { styleType } = styleSettings;
      return this.processStyle[styleType][geometryType].call(
        this,
        styleSettings,
        feature,
        layerConfig.olLayer!.get('filterEquation'),
        layerConfig.olLayer!.get('legendFilterIsOff')
      );
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * This method gets the canvas icon from the style of the feature using the layer entry config.
   *
   * @param {Feature} feature The feature that need its canvas icon to be defined.
   * @param {TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig} layerConfig The layer
   * entry config that may have a style configuration for the feature.
   *
   * @returns {Promise<HTMLCanvasElement | undefined>} The canvas icon associated to the feature or undefined if not found.
   */
  getFeatureCanvas(
    feature: Feature,
    layerConfig: TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
  ): Promise<HTMLCanvasElement | undefined> {
    const promisedCanvas = new Promise<HTMLCanvasElement | undefined>((resolve) => {
      const geometryType = getGeometryType(feature);
      const { style, source } = layerConfig as TypeVectorLayerEntryConfig;
      // Get the style accordingly to its type and geometry.
      if (style![geometryType] !== undefined) {
        const styleSettings = style![geometryType]!;
        const { styleType } = styleSettings;
        const featureStyle = this.processStyle[styleType][geometryType].call(
          this,
          styleSettings,
          feature,
          layerConfig.olLayer!.get('filterEquation'),
          layerConfig.olLayer!.get('legendFilterIsOff')
        );
        if (featureStyle) {
          if (geometryType === 'Point') {
            if (
              (isSimpleStyleConfig(styleSettings) && isSimpleSymbolVectorConfig((styleSettings as TypeSimpleStyleConfig).settings)) ||
              (isUniqueValueStyleConfig(styleSettings) &&
                isSimpleSymbolVectorConfig((styleSettings as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[0].settings)) ||
              (isClassBreakStyleConfig(styleSettings) &&
                isSimpleSymbolVectorConfig((styleSettings as TypeClassBreakStyleConfig).classBreakStyleInfo[0].settings))
            )
              resolve(this.createPointCanvas(featureStyle));
            else
              this.createIconCanvas(featureStyle).then((canvas) => {
                resolve(canvas || undefined);
              });
          } else if (geometryType === 'LineString') resolve(this.createLineStringCanvas(featureStyle));
          else resolve(this.createPolygonCanvas(featureStyle));
        } else resolve(undefined);
      } else resolve(undefined);
    });
    return promisedCanvas;
  }

  /** ***************************************************************************************************************************
   * Increment the default color index.
   */
  private incrementDefaultColorIndex() {
    this.defaultColorIndex++;
    if (this.defaultColorIndex === defaultColor.length) this.defaultColorIndex = 0;
  }

  /** ***************************************************************************************************************************
   * Get the default color using the default color index an increment it to select the next color the next time.
   *
   * @param {number} alpha The alpha value to associate to the color.
   *
   * @returns {string} The current default color string.
   */
  private getDefaultColorAndIncrementIndex(alpha: number): string {
    const color = asString(setAlphaColor(asArray(defaultColor[this.defaultColorIndex]), alpha));
    this.incrementDefaultColorIndex();
    return color;
  }

  /** ***************************************************************************************************************************
   * Get the default color using the default color index.
   *
   * @param {number} alpha The alpha value to associate to the color.
   *
   * @returns {string} The current default color string.
   */
  private getDefaultColor(alpha: number): string {
    return asString(setAlphaColor(asArray(defaultColor[this.defaultColorIndex]), alpha));
  }

  /** ***************************************************************************************************************************
   * Create the stroke options using the specified settings.
   *
   * @param {TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig} settings The settings to use
   * for the stroke options creation.
   *
   * @returns {StrokeOptions} The stroke options created.
   */
  private createStrokeOptions(
    settings: TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig
  ): StrokeOptions {
    if (settings.stroke === undefined) settings.stroke = {};
    if (settings.stroke.color === undefined) {
      if ('color' in settings)
        settings.stroke.color = asString(setAlphaColor(asArray((settings as TypeSimpleSymbolVectorConfig).color!), 1));
      else settings.stroke.color = this.getDefaultColorAndIncrementIndex(1);
    }
    const strokeOptions: StrokeOptions = {
      color: settings.stroke?.color,
      width: settings.stroke?.width,
      lineCap: 'butt',
      lineJoin: 'bevel',
      lineDash: this.lineDashSettings[settings.stroke?.lineStyle !== undefined ? settings.stroke?.lineStyle : 'solid'],
    };
    return strokeOptions;
  }

  /** ***************************************************************************************************************************
   * Process a circle symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processCircleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0.25);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    const circleOptions: CircleOptions = { radius: settings.size !== undefined ? settings.size : 4 };
    circleOptions.stroke = new Stroke(strokeOptions);
    circleOptions.fill = new Fill(fillOptions);
    if (settings.offset !== undefined) circleOptions.displacement = settings.offset;
    if (settings.rotation !== undefined) circleOptions.rotation = settings.rotation;
    return new Style({
      image: new StyleCircle(circleOptions),
    });
  }

  /** ***************************************************************************************************************************
   * Process a star shape symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
   * @param {number} points The number of points needed to create the symbol.
   * @param {number} angle The angle to use for the symbol creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processStarShapeSymbol(settings: TypeSimpleSymbolVectorConfig, points: number, angle: number): Style | undefined {
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0.25);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    const regularShapeOptions: RegularShapeOptions = {
      radius1: settings.size !== undefined ? settings.size : 6,
      radius2: settings.size !== undefined ? settings.size / 3 : 2,
      angle,
      points,
    };
    regularShapeOptions.stroke = new Stroke(strokeOptions);
    regularShapeOptions.fill = new Fill(fillOptions);
    if (settings.offset !== undefined) regularShapeOptions.displacement = settings.offset;
    if (settings.rotation !== undefined) regularShapeOptions.rotation = settings.rotation;
    return new Style({
      image: new RegularShape(regularShapeOptions),
    });
  }

  /** ***************************************************************************************************************************
   * Process a star symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processStarSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 5, 0);
  }

  /** ***************************************************************************************************************************
   * Process a X symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processXSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 4, Math.PI / 4);
  }

  /** ***************************************************************************************************************************
   * Process a + symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processPlusSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 4, 0);
  }

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
  private processRegularShape(
    settings: TypeSimpleSymbolVectorConfig,
    points: number,
    angle: number,
    scale: [number, number]
  ): Style | undefined {
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0.25);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    const regularShapeOptions: RegularShapeOptions = {
      radius: settings.size !== undefined ? settings.size : 6,
      angle,
      scale,
      points,
    };
    regularShapeOptions.stroke = new Stroke(strokeOptions);
    regularShapeOptions.fill = new Fill(fillOptions);
    if (settings.offset !== undefined) regularShapeOptions.displacement = settings.offset;
    if (settings.rotation !== undefined) regularShapeOptions.rotation = settings.rotation;
    return new Style({
      image: new RegularShape(regularShapeOptions),
    });
  }

  /** ***************************************************************************************************************************
   * Process a square symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processSquareSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 4, Math.PI / 4, [1, 1]);
  }

  /** ***************************************************************************************************************************
   * Process a Diamond symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processDiamondSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 4, 0, [0.75, 1]);
  }

  /** ***************************************************************************************************************************
   * Process a triangle symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processTriangleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 3, 0, [1, 1]);
  }

  /** ***************************************************************************************************************************
   * Process an icon symbol using the settings.
   *
   * @param {TypeIconSymbolVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processIconSymbol(settings: TypeIconSymbolVectorConfig): Style | undefined {
    const iconOptions: IconOptions = {};
    iconOptions.src = `data:${settings.mimeType};base64,${settings.src}`;
    if (settings.width !== undefined && settings.height !== undefined) iconOptions.size = [settings.width, settings.height];
    if (settings.offset !== undefined) iconOptions.offset = settings.offset;
    if (settings.rotation !== undefined) iconOptions.rotation = settings.rotation;
    if (settings.opacity !== undefined) iconOptions.opacity = settings.opacity;
    return new Style({
      image: new StyleIcon(iconOptions),
    });
  }

  /** ***************************************************************************************************************************
   * Process a simple point symbol using the settings. Simple point symbol may be an icon or a vector symbol.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the Style creation.
   * @param {Feature} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processSimplePoint(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    const settings = (isSimpleStyleConfig(styleSettings) ? styleSettings.settings : styleSettings) as TypeKindOfVectorSettings;
    if (isSimpleSymbolVectorConfig(settings)) {
      const { symbol } = settings;
      return this.processSymbol[symbol].call(this, settings);
    }
    if (isIconSymbolVectorConfig(settings)) return this.processIconSymbol(settings);
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process a simple lineString using the settings.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the Style creation.
   * @param {Feature} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processSimpleLineString(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    const settings = (isSimpleStyleConfig(styleSettings) ? styleSettings.settings : styleSettings) as TypeKindOfVectorSettings;
    let geometry;
    if (feature) {
      geometry = feature.getGeometry() as Geometry;
    }
    if (isLineStringVectorConfig(settings)) {
      const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
      return new Style({ stroke: new Stroke(strokeOptions), geometry });
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process a simple solid fill (polygon) using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processSolidFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0.25);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
      geometry,
    });
  }

  /** ***************************************************************************************************************************
   * Process a null fill (polygon with fill opacity = 0) using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processNullFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
      geometry,
    });
  }

  /** ***************************************************************************************************************************
   * Process a pattern fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   * @param {FillPaternLine[]} fillPaternLines The fill patern lines needed to create the fill.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processPaternFill(settings: TypePolygonVectorConfig, fillPaternLines: FillPaternLine[], geometry?: Geometry): Style | undefined {
    const paternSize = settings.paternSize !== undefined ? settings.paternSize : 8;
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0.25);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);

    // Canvas used to create the pattern fill. It is bigger to take into account the repeating aspect of the fill.
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = paternSize * 2;
    drawingCanvas.height = paternSize * 2;
    const context = drawingCanvas.getContext('2d');
    context!.strokeStyle = settings.color;
    context!.lineCap = 'butt';
    context!.lineWidth = settings.paternWidth !== undefined ? settings.paternWidth : 1;
    context!.beginPath();
    for (let i = 0; i < fillPaternLines.length; i++) {
      const { moveTo, lineTo } = fillPaternLines[i];
      context!.moveTo(moveTo[0] * paternSize, moveTo[1] * paternSize);
      context!.lineTo(lineTo[0] * paternSize, lineTo[1] * paternSize);
    }
    context!.stroke();

    // extract the sub area that will define the pattern that will repeat properly.
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = paternSize;
    outputCanvas.height = paternSize;
    const outputContext = outputCanvas.getContext('2d');
    outputContext!.putImageData(context!.getImageData(paternSize / 2, paternSize / 2, paternSize, paternSize), 0, 0);

    fillOptions.color = outputContext!.createPattern(outputCanvas, 'repeat');
    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
      geometry,
    });
  }

  /** ***************************************************************************************************************************
   * Process a backward diagonal fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processBackwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.backwardDiagonal, geometry);
  }

  /** ***************************************************************************************************************************
   * Process a forward diagonal fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processForwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.forwardDiagonal, geometry);
  }

  /** ***************************************************************************************************************************
   * Process a cross fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.cross, geometry);
  }

  /** ***************************************************************************************************************************
   * Process a diagonal cross fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processDiagonalCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.diagonalCross, geometry);
  }

  /** ***************************************************************************************************************************
   * Process a horizontal fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processHorizontalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.horizontal, geometry);
  }

  /** ***************************************************************************************************************************
   * Process a vertical fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings The settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processVerticalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.vertical, geometry);
  }

  /** ***************************************************************************************************************************
   * Process a simple polygon using the settings.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the Style creation.
   * @param {Feature} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processSimplePolygon(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    const settings = (isSimpleStyleConfig(styleSettings) ? styleSettings.settings : styleSettings) as TypeKindOfVectorSettings;
    let geometry;
    if (feature) {
      geometry = feature.getGeometry() as Geometry;
    }
    if (isFilledPolygonVectorConfig(settings)) {
      const { fillStyle } = settings;
      if (geometry !== undefined) {
        return this.processFillStyle[fillStyle].call(this, settings, geometry);
      }
      return this.processFillStyle[fillStyle].call(this, settings);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Search the unique value entry using the field values stored in the feature.
   *
   * @param {string[]} fields The fields involved in the unique value definition.
   * @param {TypeUniqueValueStyleInfo[]} uniqueValueStyleInfo The unique value configuration.
   * @param {Feature} feature The feature used to test the unique value conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private searchUniqueValueEntry(fields: string[], uniqueValueStyleInfo: TypeUniqueValueStyleInfo[], feature: Feature): number | undefined {
    for (let i = 0; i < uniqueValueStyleInfo.length; i++) {
      for (let j = 0, isEqual = true; j < fields.length && isEqual; j++) {
        // For obscure reasons, it seems that sometimes the field names in the feature do not have the same case as those in the
        // unique value definition.
        const fieldName = (feature as Feature).getKeys().find((key) => {
          return key.toLowerCase() === fields[j].toLowerCase();
        });
        if (fieldName) {
          // eslint-disable-next-line eqeqeq
          isEqual = feature.get(fieldName) == uniqueValueStyleInfo[i].values[j];
          if (isEqual && j + 1 === fields.length) return i;
          // eslint-disable-next-line no-console
        } else console.log(`Can not find field ${fields[j]}`);
      }
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the unique value settings using a point feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {Feature} feature the feature used to test the unique value conditions.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff when true, do not apply legend filter.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processUniqueValuePoint(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType,
    legendFilterIsOff?: boolean
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature!);
      if (i !== undefined && (legendFilterIsOff || uniqueValueStyleInfo[i].visible !== 'no'))
        return this.processSimplePoint(uniqueValueStyleInfo[i].settings);
      if (i === undefined && defaultSettings !== undefined && (legendFilterIsOff || styleSettings.defaultVisible !== 'no'))
        return this.processSimplePoint(defaultSettings);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the unique value settings using a lineString feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {Feature} feature the feature used to test the unique value conditions.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff when true, do not apply legend filter.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processUniqueLineString(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType,
    legendFilterIsOff?: boolean
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature!);
      if (i !== undefined && (legendFilterIsOff || uniqueValueStyleInfo[i].visible !== 'no'))
        return this.processSimpleLineString(uniqueValueStyleInfo[i].settings, feature);
      if (i === undefined && defaultSettings !== undefined && (legendFilterIsOff || styleSettings.defaultVisible !== 'no'))
        return this.processSimpleLineString(defaultSettings, feature);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the unique value settings using a polygon feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {Feature} feature the feature used to test the unique value conditions.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff when true, do not apply legend filter.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processUniquePolygon(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType,
    legendFilterIsOff?: boolean
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature!);
      if (i !== undefined && (legendFilterIsOff || uniqueValueStyleInfo[i].visible !== 'no'))
        return this.processSimplePolygon(uniqueValueStyleInfo[i].settings, feature);
      if (i === undefined && defaultSettings !== undefined && (legendFilterIsOff || styleSettings.defaultVisible !== 'no'))
        return this.processSimplePolygon(defaultSettings, feature);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Search the class breakentry using the field value stored in the feature.
   *
   * @param {string[]} field The field involved in the class break definition.
   * @param {TypeClassBreakStyleInfo[]} classBreakStyleInfo The class break configuration.
   * @param {Feature} feature The feature used to test the class break conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private searchClassBreakEntry(field: string, classBreakStyleInfo: TypeClassBreakStyleInfo[], feature: Feature): number | undefined {
    // For obscure reasons, it seems that sometimes the field names in the feature do not have the same case as those in the
    // class break definition.
    const featureKey = (feature as Feature).getKeys().filter((key) => {
      return key.toLowerCase() === field.toLowerCase();
    });
    if (featureKey.length !== 1) return undefined;

    const fieldValue = feature.get(featureKey[0]) as number | string;

    if (fieldValue >= classBreakStyleInfo[0].minValue! && fieldValue <= classBreakStyleInfo[0].maxValue) return 0;

    for (let i = 1; i < classBreakStyleInfo.length; i++) {
      if (fieldValue > classBreakStyleInfo[i].minValue! && fieldValue <= classBreakStyleInfo[i].maxValue) return i;
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the class break settings using a Point feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {Feature} feature the feature used to test the unique value conditions.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff when true, do not apply legend filter.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processClassBreaksPoint(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType,
    legendFilterIsOff?: boolean
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfo } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfo, feature!);
      if (i !== undefined && (legendFilterIsOff || classBreakStyleInfo[i].visible !== 'no'))
        return this.processSimplePoint(classBreakStyleInfo[i].settings);
      if (i === undefined && defaultSettings !== undefined && (legendFilterIsOff || styleSettings.defaultVisible !== 'no'))
        return this.processSimplePoint(defaultSettings);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the class break settings using a lineString feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {Feature} feature the feature used to test the unique value conditions.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff when true, do not apply legend filter.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processClassBreaksLineString(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType,
    legendFilterIsOff?: boolean
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfo } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfo, feature!);
      if (i !== undefined && (legendFilterIsOff || classBreakStyleInfo[i].visible !== 'no'))
        return this.processSimpleLineString(classBreakStyleInfo[i].settings, feature);
      if (i === undefined && defaultSettings !== undefined && (legendFilterIsOff || styleSettings.defaultVisible !== 'no'))
        return this.processSimpleLineString(defaultSettings, feature);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the class break settings using a Polygon feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {Feature} feature the feature used to test the unique value conditions.
   * @param {FilterNodeArrayType} filterEquation The filter equation associated to the layer.
   * @param {boolean} legendFilterIsOff when true, do not apply legend filter.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processClassBreaksPolygon(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    filterEquation?: FilterNodeArrayType,
    legendFilterIsOff?: boolean
  ): Style | undefined {
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation!)) return undefined;

    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfo } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfo, feature!);
      if (i !== undefined && (legendFilterIsOff || classBreakStyleInfo[i].visible !== 'no'))
        return this.processSimplePolygon(classBreakStyleInfo[i].settings, feature);
      if (i === undefined && defaultSettings !== undefined && (legendFilterIsOff || styleSettings.defaultVisible !== 'no'))
        return this.processSimplePolygon(defaultSettings, feature);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Create a default style to use with a vector feature that has no style configuration.
   *
   * @param {TypeStyleGeometry} geometryType The type of geometry (Point, LineString, Polygon).
   * @param {TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig} layerConfig the layer entry config to configure.
   *
   * @returns {TypeStyleConfig | undefined} The Style configurationcreated. Undefined if unable to create it.
   */
  private createDefaultStyle(
    geometryType: TypeStyleGeometry,
    layerConfig: TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
  ): TypeStyleConfig | undefined {
    if (layerConfig.style === undefined) layerConfig.style = {};
    const label = getLocalizedValue(layerConfig.layerName, this.mapId) as string;
    if (geometryType === 'Point') {
      const settings: TypeSimpleSymbolVectorConfig = {
        type: 'simpleSymbol',
        color: this.getDefaultColor(0.25),
        stroke: {
          color: this.getDefaultColorAndIncrementIndex(1),
          lineStyle: 'solid',
          width: 1,
        },
        symbol: 'circle',
      };
      const styleSettings: TypeSimpleStyleConfig = { styleType: 'simple', label, settings };
      layerConfig.style[geometryType] = styleSettings;
      return layerConfig.style;
    }
    if (geometryType === 'LineString') {
      const settings: TypeLineStringVectorConfig = {
        type: 'lineString',
        stroke: { color: this.getDefaultColorAndIncrementIndex(1) },
      };
      const styleSettings: TypeSimpleStyleConfig = { styleType: 'simple', label, settings };
      layerConfig.style[geometryType] = styleSettings;
      return layerConfig.style;
    }
    if (geometryType === 'Polygon') {
      const settings: TypePolygonVectorConfig = {
        type: 'filledPolygon',
        color: this.getDefaultColor(0.25),
        stroke: { color: this.getDefaultColorAndIncrementIndex(1) },
        fillStyle: 'solid',
      };
      const styleSettings: TypeSimpleStyleConfig = { styleType: 'simple', label, settings };
      layerConfig.style[geometryType] = styleSettings;
      return layerConfig.style;
    }
    // eslint-disable-next-line no-console
    console.log(`Geometry type ${geometryType} is not supported by the GeoView viewer.`);
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Use the filter equation and the feature fields to determine if the feature is visible.
   *
   * @param {Feature} feature the feature used to find the visibility value to return.
   * @param {FilterNodeArrayType} filterEquation the filter used to find the visibility value to return.
   *
   * @returns {boolean | undefined} The visibility flag for the feature specified.
   */
  private featureIsNotVisible(feature: Feature, filterEquation: FilterNodeArrayType): boolean | undefined {
    const operatorStack: FilterNodeArrayType = [];
    const dataStack: FilterNodeArrayType = [];

    const operatorAt = (index: number, stack: FilterNodeArrayType): FilterNodeType | undefined => {
      if (index < 0 && stack.length + index >= 0) return stack[stack.length + index];
      if (index > 0 && index < stack.length) return stack[index];
      return undefined;
    };

    const findPriority = (target: FilterNodeType): number => {
      const i = operatorPriority.findIndex((element) => element.key === target.nodeValue);
      if (i === -1) return -1;
      return operatorPriority[i].priority;
    };

    try {
      for (let i = 0; i < filterEquation.length; i++) {
        if (filterEquation[i].nodeType === NodeType.variable) {
          const fieldValue = feature.get(filterEquation[i].nodeValue as string);
          dataStack.push({ nodeType: NodeType.variable, nodeValue: fieldValue || null });
        } else if ([NodeType.string, NodeType.number].includes(filterEquation[i].nodeType)) dataStack.push({ ...filterEquation[i] });
        else if (filterEquation[i].nodeType === NodeType.group)
          if (filterEquation[i].nodeValue === '(') {
            operatorStack.push({ ...filterEquation[i] });
            dataStack.push({ ...filterEquation[i] });
          } else {
            let operatorOnTop1 = operatorAt(-1, operatorStack);
            for (; operatorOnTop1 && operatorOnTop1.nodeValue !== '('; this.executeOperator(operatorStack.pop()!, dataStack))
              operatorOnTop1 = operatorAt(-2, operatorStack);
            operatorStack.pop();
            if (operatorOnTop1 && operatorOnTop1.nodeValue === '(') {
              const dataOnTop = dataStack.pop();
              dataStack.pop();
              dataStack.push(dataOnTop!);
            }
          }
        else {
          // Validate the UPPER and LOWER syntax (i.e.: must be followed by an opening parenthesis)
          if (
            ['upper', 'lower'].includes(filterEquation[i].nodeValue as string) &&
            (filterEquation.length === i + 1 ||
              (filterEquation[i + 1].nodeType !== NodeType.group && filterEquation[i + 1].nodeValue !== '('))
          )
            throw new Error(`Invalid vector layer filter (${(filterEquation[i].nodeValue as string).toUpperCase()} syntax error).`);

          for (
            let operatorOnTop2 = operatorAt(-1, operatorStack);
            operatorOnTop2 && operatorOnTop2.nodeValue !== '(' && findPriority(operatorOnTop2) > findPriority(filterEquation[i]);
            this.executeOperator(operatorStack.pop()!, dataStack)
          )
            operatorOnTop2 = operatorAt(-2, operatorStack);
          operatorStack.push({ ...filterEquation[i] });
        }
      }
      for (
        let operatorOnTop3 = operatorAt(-1, operatorStack);
        operatorOnTop3 && operatorOnTop3.nodeValue !== '(';
        this.executeOperator(operatorStack.pop()!, dataStack)
      )
        operatorOnTop3 = operatorAt(-2, operatorStack);
      operatorStack.pop();
    } catch (error) {
      throw new Error(`Invalid vector layer filter (${(error as { message: string }).message}).`);
    }
    if (dataStack.length !== 1 || dataStack[0].nodeType !== NodeType.variable)
      throw new Error(`Invalid vector layer filter (invalid structure).`);
    const dataStackTop = dataStack.pop();
    return dataStackTop ? !(dataStackTop.nodeValue as boolean) : undefined;
  }

  /** ***************************************************************************************************************************
   * Execute an operator using the nodes on the data stack. The filter equation is evaluated using a postfix notation. The result
   * is pushed back on the data stack. If a problem is detected, an error object is thrown with an explanatory message.
   *
   * @param {FilterNodeType} operator the operator to execute.
   * @param {FilterNodeArrayType} dataStack The data stack to use for the operator execution.
   */
  private executeOperator(operator: FilterNodeType, dataStack: FilterNodeArrayType) {
    if (operator.nodeType === NodeType.binary) {
      if (dataStack.length < 2 || dataStack[dataStack.length - 2].nodeValue === '(')
        throw new Error(`binary operator error - operator = '${operator.nodeValue}'`);
      else {
        const operand2 = dataStack.pop()!;
        const operand1 = dataStack.pop()!;
        let valueToPush;
        switch (operator.nodeValue) {
          case 'is not':
            if (operand2.nodeValue !== null) throw new Error(`Invalid is not null operator syntax`);
            dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue !== null });
            break;
          case 'is':
            if (operand2.nodeValue !== null) throw new Error(`Invalid is null operator syntax`);
            dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue === null });
            break;
          case '=':
            if (operand1.nodeValue === null || operand2.nodeValue === null)
              dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue === operand2.nodeValue });
            break;
          case '<':
            if (operand1.nodeValue === null || operand2.nodeValue === null)
              dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue < operand2.nodeValue });
            break;
          case '>':
            if (operand1.nodeValue === null || operand2.nodeValue === null)
              dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue > operand2.nodeValue });
            break;
          case '<=':
            if (operand1.nodeValue === null || operand2.nodeValue === null)
              dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue <= operand2.nodeValue });
            break;
          case '>=':
            if (operand1.nodeValue === null || operand2.nodeValue === null)
              dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue >= operand2.nodeValue });
            break;
          case '<>':
            if (operand1.nodeValue === null || operand2.nodeValue === null)
              dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue !== operand2.nodeValue });
            break;
          case 'and':
            if (
              (operand1.nodeValue === null && (operand2.nodeValue === null || operand2.nodeValue === true)) ||
              (operand1.nodeValue === true && operand2.nodeValue === null)
            )
              dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
            else if (
              (operand1.nodeValue === null && operand2.nodeValue === false) ||
              (operand1.nodeValue === false && operand2.nodeValue === null)
            )
              dataStack.push({ nodeType: NodeType.variable, nodeValue: false });
            else if (typeof operand1.nodeValue !== 'boolean' || typeof operand2.nodeValue !== 'boolean')
              throw new Error(`and operator error`);
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue && operand2.nodeValue });
            break;
          case 'or':
            if (
              (operand1.nodeValue === null && (operand2.nodeValue === null || operand2.nodeValue === false)) ||
              (operand1.nodeValue === false && operand2.nodeValue === null)
            )
              dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
            else if (
              (operand1.nodeValue === null && operand2.nodeValue === true) ||
              (operand1.nodeValue === true && operand2.nodeValue === null)
            )
              dataStack.push({ nodeType: NodeType.variable, nodeValue: true });
            else if (typeof operand1.nodeValue !== 'boolean' || typeof operand2.nodeValue !== 'boolean')
              throw new Error(`or operator error`);
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue || operand2.nodeValue });
            break;
          case '+':
            if (typeof operand1.nodeValue !== 'number' || typeof operand2.nodeValue !== 'number') throw new Error(`+ operator error`);
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue + operand2.nodeValue });
            break;
          case '-':
            if (typeof operand1.nodeValue !== 'number' || typeof operand2.nodeValue !== 'number') throw new Error(`- operator error`);
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue - operand2.nodeValue });
            break;
          case '*':
            if (typeof operand1.nodeValue !== 'number' || typeof operand2.nodeValue !== 'number') throw new Error(`* operator error`);
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue * operand2.nodeValue });
            break;
          case '/':
            if (typeof operand1.nodeValue !== 'number' || typeof operand2.nodeValue !== 'number') throw new Error(`/ operator error`);
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue / operand2.nodeValue });
            break;
          case '||':
            if ((typeof operand1.nodeValue !== 'string' && operand1.nodeValue !== null) || typeof operand2.nodeValue !== 'string')
              throw new Error(`|| operator error`);
            else
              dataStack.push({
                nodeType: NodeType.variable,
                nodeValue: operand1.nodeValue === null ? null : `${operand1.nodeValue}${operand2.nodeValue}`,
              });
            break;
          case 'like':
            if ((typeof operand1.nodeValue !== 'string' && operand1.nodeValue !== null) || typeof operand2.nodeValue !== 'string')
              throw new Error(`like operator error`);
            else {
              const regularExpression = new RegExp(
                operand2.nodeValue.toLowerCase().replaceAll('.', '\\.').replaceAll('%', '.*').replaceAll('_', '.'),
                ''
              );
              const match = operand1.nodeValue ? operand1.nodeValue.toLowerCase().match(regularExpression) : null;
              dataStack.push({ nodeType: NodeType.variable, nodeValue: match !== null && match[0] === operand1.nodeValue?.toLowerCase() });
            }
            break;
          case ',':
            valueToPush = {
              nodeType: NodeType.variable,
              nodeValue: Array.isArray(operand2.nodeValue)
                ? ([operand1.nodeValue].concat(operand2.nodeValue) as string[] | number[])
                : ([operand1.nodeValue, operand2.nodeValue] as string[] | number[]),
            };
            if (typeof (valueToPush.nodeValue as string[] | number[])[0] !== typeof (valueToPush.nodeValue as string[] | number[])[1])
              throw new Error(`IN clause can't mix types`);
            dataStack.push(valueToPush);
            break;
          case 'in':
            if (Array.isArray(operand2.nodeValue))
              dataStack.push({
                nodeType: NodeType.variable,
                nodeValue: (operand2.nodeValue as unknown[]).includes(operand1.nodeValue as string),
              });
            else
              dataStack.push({
                nodeType: NodeType.variable,
                nodeValue: operand1.nodeValue === operand2.nodeValue,
              });
            break;
          default:
            throw new Error(`unknown operator error`);
        }
      }
      return;
    }

    if (operator.nodeType === NodeType.unary) {
      if (dataStack.length < 1 || dataStack[dataStack.length - 1].nodeValue === '(') throw new Error(`unary operator error`);
      else {
        const operand = dataStack.pop()!;
        switch (operator.nodeValue) {
          case 'not':
            if (typeof operand.nodeValue !== 'boolean') throw new Error(`not operator error`);
            dataStack.push({ nodeType: NodeType.variable, nodeValue: !operand.nodeValue });
            break;
          case 'u-':
            if (typeof operand.nodeValue !== 'number') throw new Error(`unary - operator error`);
            dataStack.push({ nodeType: NodeType.variable, nodeValue: -operand.nodeValue });
            break;
          case 'u+':
            if (typeof operand.nodeValue !== 'number') throw new Error(`unary + operator error`);
            dataStack.push({ nodeType: NodeType.variable, nodeValue: operand.nodeValue });
            break;
          case 'date':
            if (operand.nodeValue === null) dataStack.push(operand);
            else if (typeof operand.nodeValue !== 'string') throw new Error(`DATE operator error`);
            else {
              operand.nodeValue = api.dateUtilities.applyInputDateFormat(operand.nodeValue);
              dataStack.push({
                nodeType: NodeType.variable,
                nodeValue: api.dateUtilities.convertToMilliseconds(api.dateUtilities.convertToUTC(operand.nodeValue)),
              });
            }
            break;
          case 'upper':
            if (operand.nodeValue === null) dataStack.push(operand);
            else if (typeof operand.nodeValue !== 'string') throw new Error(`UPPER operator error`);
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand.nodeValue.toUpperCase() });
            break;
          case 'lower':
            if (operand.nodeValue === null) dataStack.push(operand);
            else if (typeof operand.nodeValue !== 'string') throw new Error(`LOWER operator error`);
            else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand.nodeValue.toLowerCase() });
            break;
          default:
            throw new Error(`unknown operator error`);
        }
      }
    }
  }

  /** ***************************************************************************************************************************
   * Analyse the filter and split it in syntaxique nodes.  If a problem is detected, an error object is thrown with an
   * explanatory message.
   *
   * @param {FilterNodeArrayType} filterNodeArrayType the node array to analyse.
   *
   * @returns {FilterNodeArrayType} The new node array with all nodes classified.
   */
  analyzeLayerFilter(filterNodeArrayType: FilterNodeArrayType): FilterNodeArrayType {
    let resultingKeywordArray = filterNodeArrayType;
    resultingKeywordArray[0].nodeValue = (resultingKeywordArray[0].nodeValue as string).replaceAll(/\s{2,}/g, ' ').trim();
    resultingKeywordArray[0].nodeValue = resultingKeywordArray[0].nodeValue.split(/^date '|(?<=\s)date '/gi).join("date°'");
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, "'");
    resultingKeywordArray = this.extractStrings(resultingKeywordArray);

    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '(');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, ')');
    if (
      resultingKeywordArray.reduce((result, node) => {
        return node.nodeType === NodeType.group ? result + 1 : result;
      }, 0) % 2
    )
      throw new Error(`unbalanced parentheses`);

    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'date', /^date°$|^date°|(?<=\s)date°/g);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'upper', /^upper\b|(?<=\s)upper\b/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'lower', /^lower\b|(?<=\s)lower\b/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'is not', /^is\s+not\b|(?<=\s)is\s+not\b/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'is', /^is\b(?!\s*not\b)|(?<=\s)is\b(?!\s*not\b)/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'in', /^in\b|(?<=\s)in\b/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, ',');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'not', /^not\b|(?<=\s)not\b/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'and', /^and\b|(?<=\s)and\b/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'or', /^or\b|(?<=\s)or\b/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, 'like', /^like\b|(?<=\s)like\b/gi);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '=', /(?<![><])=/g);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '<', /<(?![>=])/g);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '>', /(?<!<)>(?!=)/g);
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '<>');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '<=');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '>=');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '+');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '-');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '*');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '/');
    resultingKeywordArray = this.extractKeyword(resultingKeywordArray, '||');
    resultingKeywordArray = this.classifyUnprocessedNodes(resultingKeywordArray);

    return resultingKeywordArray;
  }

  /** ***************************************************************************************************************************
   * Extract the specified keyword and associate a node type to their nodes. In some cases, the extraction uses an optionally
   * regular expression.
   *
   * @param {FilterNodeArrayType} FilterNodeArrayType the array of keywords to process.
   * @param {string} keyword the keyword to extract.
   * @param {RegExp} regExp an optional regular expression to use for the extraction.
   *
   * @returns {FilterNodeArrayType} The new keywords array.
   */
  private extractKeyword(filterNodeArray: FilterNodeArrayType, keyword: string, regExp?: RegExp): FilterNodeArrayType {
    // eslint-disable-next-line no-nested-ternary
    const getNodeType = (keywordValue: string): NodeType => {
      if (['+', '-'].includes(keywordValue)) return NodeType.unprocessedNode;
      if (binaryKeywors.includes(keywordValue)) return NodeType.binary;
      if (unaryKeywords.includes(keywordValue)) return NodeType.unary;
      if (groupKeywords.includes(keywordValue)) return NodeType.group;
      return NodeType.keyword;
    };

    return filterNodeArray.reduce((newKeywordArray, node) => {
      if (node.nodeType !== NodeType.unprocessedNode) newKeywordArray.push(node);
      else {
        newKeywordArray = newKeywordArray.concat(
          (node.nodeValue as string)
            .trim()
            .split(regExp === undefined ? keyword : regExp)
            .reduce((nodeArray, splitNode) => {
              if (splitNode === '') {
                nodeArray.push({ nodeType: getNodeType(keyword), nodeValue: keyword });
                return nodeArray;
              }
              nodeArray.push({ nodeType: NodeType.unprocessedNode, nodeValue: splitNode.trim() });
              nodeArray.push({ nodeType: getNodeType(keyword), nodeValue: keyword });
              return nodeArray;
            }, [] as FilterNodeArrayType)
            .slice(0, -1)
        );
      }
      return newKeywordArray;
    }, [] as FilterNodeArrayType);
  }

  /** ***************************************************************************************************************************
   * Extract the string nodes from the keyword array. This operation is done at the beginning of the classification. This allows
   * to considere Keywords in a string as a normal word. If a problem is detected, an error object is thrown with an explanatory
   * message.
   *
   * @param {FilterNodeArrayType} keywordArray the array of keywords to process.
   *
   * @returns {FilterNodeArrayType} The new keywords array with all string nodes classified.
   */
  private extractStrings(keywordArray: FilterNodeArrayType): FilterNodeArrayType {
    let stringNeeded = false;
    let stringHasBegun = false;
    let contiguousApostrophes = 0;
    let stringValue = '';
    const keywordArrayToReturn = keywordArray.reduce((newKeywordArray, node) => {
      if (stringHasBegun) {
        if (node.nodeType === NodeType.unprocessedNode) {
          if (stringNeeded) {
            stringValue = `${stringValue}${node.nodeValue}`;
            stringNeeded = false;
          } else {
            newKeywordArray.push({ nodeType: NodeType.string, nodeValue: stringValue });
            newKeywordArray.push(node);
            stringValue = '';
            stringHasBegun = false;
            stringNeeded = false;
            contiguousApostrophes = 0;
          }
        } else {
          contiguousApostrophes += 1;
          if (contiguousApostrophes === 2) {
            stringValue = `${stringValue}'`;
            stringNeeded = true;
            contiguousApostrophes = 0;
          }
        }
        return newKeywordArray;
      }
      if (node.nodeType === NodeType.keyword) {
        stringHasBegun = true;
        stringNeeded = true;
      } else newKeywordArray.push(node);
      return newKeywordArray;
    }, [] as FilterNodeArrayType);
    if (stringHasBegun)
      if (!stringNeeded && contiguousApostrophes === 1) keywordArrayToReturn.push({ nodeType: NodeType.string, nodeValue: stringValue });
      else throw new Error(`string not closed`);
    return keywordArrayToReturn;
  }

  /** ***************************************************************************************************************************
   * Classify the remaining nodes to complete the classification. The plus and minus can be a unary or a binary operator. It is
   * only at the end that we can determine there node type. Nodes that start with a number are numbers, otherwise they are
   * variables. If a problem is detected, an error object is thrown with an explanatory message.
   *
   * @param {FilterNodeArrayType} keywordArray the array of keywords to process.
   *
   * @returns {FilterNodeArrayType} The new keywords array with all nodes classified.
   */
  private classifyUnprocessedNodes(keywordArray: FilterNodeArrayType): FilterNodeArrayType {
    return keywordArray.map((node, i) => {
      if (node.nodeType === NodeType.unprocessedNode) {
        if (Number.isNaN(Number((node.nodeValue as string).slice(0, 1)))) {
          if (['+', '-'].includes(node.nodeValue as string))
            if (i !== 0 && [NodeType.number, NodeType.string, NodeType.variable].includes(keywordArray[i - 1].nodeType))
              node.nodeType = NodeType.binary;
            else {
              node.nodeType = NodeType.unary;
              node.nodeValue = `u${node.nodeValue}`;
            }
          else if (typeof node.nodeValue === 'string' && node.nodeValue.toLowerCase() === 'null') {
            node.nodeType = NodeType.variable;
            node.nodeValue = null;
          } else {
            node.nodeType = NodeType.variable;
          }
          return node;
        }
        node.nodeType = NodeType.number;
        node.nodeValue = Number(node.nodeValue);
        if (Number.isNaN(node.nodeValue)) throw new Error(`${node.nodeValue} is an invalid number`);
        return node;
      }
      return node;
    });
  }
}
