/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import { asArray, asString } from 'ol/color';
import { Text, Style, Stroke, Fill, RegularShape, Circle as StyleCircle, Icon as StyleIcon } from 'ol/style';
import { Geometry, LineString, Point, Polygon } from 'ol/geom';
import Icon, { Options as IconOptions } from 'ol/style/Icon';
import { Options as CircleOptions } from 'ol/style/Circle';
import { Options as RegularShapeOptions } from 'ol/style/RegularShape';
import { Options as StrokeOptions } from 'ol/style/Stroke';
import { Options as FillOptions } from 'ol/style/Fill';
import { Options as TextOptions } from 'ol/style/Text';
import Feature, { FeatureLike } from 'ol/Feature';
import { toContext } from 'ol/render';
import { Size } from 'ol/size';

import { getLocalizedValue, setAlphaColor } from '../../core/utils/utilities';
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
  TypeBaseVectorConfig,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
  TypeBaseSourceVectorInitialConfig,
} from '../map/map-schema-types';
import { defaultColor } from './geoview-renderer-types';
import { Layer } from '../layer/layer';
import { TypeLayerStyle, TypeStyleRepresentation } from '../layer/geoview-layers/abstract-geoview-layers';

type FillPaternLine = { moveTo: [number, number]; lineTo: [number, number] };
type FillPaternSettings = Record<TypeFillStyle, FillPaternLine[] | []>;

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
  private processStyle: Record<
    TypeBaseStyleType,
    Record<TypeStyleGeometry, (styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike) => Style | undefined>
  > = {
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
      image.onload = () => {
        resolve(image);
      };
      image.onerror = (reason) => {
        // eslint-disable-next-line no-console
        console.log('GeoviewRenderer.loadImage(src) - Error while loading the src image =', src);
        resolve(null);
      };
      image.src = src!;
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
    const size = pointStyle?.getImage().getSize() as Size;
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
   * @param {TypeLayerStyle} layerStyle The object that will receive the created canvas.
   * @param {TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[]} arrayOfPointStyleConfig The array of point style
   * configuration.
   * @param {(value: TypeLayerStyle | PromiseLike<TypeLayerStyle>) => void} resolve The function that will resolve the promise
   * of the calling methode.
   */
  private processArrayOfPointStyleConfig(
    layerStyle: TypeLayerStyle,
    arrayOfPointStyleConfig: TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[],
    resolve: (value: TypeLayerStyle | PromiseLike<TypeLayerStyle>) => void
  ) {
    // UniqueValue or ClassBreak point style configuration ============================================================
    const styleArray: (HTMLCanvasElement | null)[] = layerStyle.Point!.arrayOfCanvas!;
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
      resolve(layerStyle);
    });
  }

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
  private getPointStyleSubRoutine(
    resolve: (value: TypeLayerStyle | PromiseLike<TypeLayerStyle>) => void,
    layerStyle: TypeLayerStyle,
    defaultSettings?: TypeKindOfVectorSettings,
    arrayOfPointStyleConfig?: TypeUniqueValueStyleInfo[] | TypeClassBreakStyleInfo[]
  ) {
    if (defaultSettings) {
      if (isIconSymbolVectorConfig(defaultSettings)) {
        // Icon symbol ======================================================================================
        this.createIconCanvas(this.processSimplePoint(defaultSettings)).then((canvas) => {
          layerStyle.Point!.defaultCanvas = canvas;
          if (arrayOfPointStyleConfig) {
            layerStyle.Point!.arrayOfCanvas = [];
            this.processArrayOfPointStyleConfig(layerStyle, arrayOfPointStyleConfig, resolve);
          } else resolve(layerStyle);
        });
      } else {
        // Simple vector symbol =============================================================================
        layerStyle.Point!.defaultCanvas = this.createPointCanvas(this.processSimplePoint(defaultSettings));
        if (arrayOfPointStyleConfig) {
          layerStyle.Point!.arrayOfCanvas = [];
          this.processArrayOfPointStyleConfig(layerStyle, arrayOfPointStyleConfig, resolve);
        } else resolve(layerStyle);
      }
    } else {
      layerStyle.Point!.arrayOfCanvas = [];
      this.processArrayOfPointStyleConfig(layerStyle, arrayOfPointStyleConfig!, resolve);
    }
  }

  /** ***************************************************************************************************************************
   * This method gets the point style of the layer as specified by the style configuration.
   *
   * @param {TypeStyleConfig} styleConfig The style configuration associated to the layer.
   *
   * @returns {Promise<TypeLayerStyle>} A promise that the layer style is processed.
   */
  getStyle(styleConfig: TypeStyleConfig): Promise<TypeLayerStyle> {
    const promisedLayerStyle = new Promise<TypeLayerStyle>((resolve) => {
      const layerStyle: TypeLayerStyle = {};

      if (styleConfig.Point) {
        // ======================================================================================================================
        // Point style configuration ============================================================================================
        layerStyle.Point = {};
        if (isSimpleStyleConfig(styleConfig.Point)) {
          this.getPointStyleSubRoutine(resolve, layerStyle, styleConfig.Point.settings);
        } else if (isUniqueValueStyleConfig(styleConfig.Point)) {
          this.getPointStyleSubRoutine(
            resolve,
            layerStyle,
            styleConfig.Point.defaultSettings,
            (styleConfig.Point as TypeUniqueValueStyleConfig).uniqueValueStyleInfo
          );
        } else if (isClassBreakStyleConfig(styleConfig.Point)) {
          this.getPointStyleSubRoutine(
            resolve,
            layerStyle,
            styleConfig.Point.defaultSettings,
            (styleConfig.Point as TypeClassBreakStyleConfig).classBreakStyleInfo
          );
        }
      }

      if (styleConfig.LineString) {
        // ======================================================================================================================
        // LineString style configuration =======================================================================================
        layerStyle.LineString = {};
        if (isSimpleStyleConfig(styleConfig.LineString)) {
          layerStyle.LineString.defaultCanvas = this.createLineStringCanvas(this.processSimpleLineString(styleConfig.LineString));
        } else if (isUniqueValueStyleConfig(styleConfig.LineString)) {
          if (styleConfig.LineString.defaultSettings)
            layerStyle.LineString.defaultCanvas = this.createLineStringCanvas(
              this.processSimpleLineString(styleConfig.LineString.defaultSettings)
            );
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.LineString.uniqueValueStyleInfo.forEach((styleInfo) => {
            styleArray.push(this.createLineStringCanvas(this.processSimpleLineString(styleInfo.settings)));
          });
          layerStyle.LineString.arrayOfCanvas = styleArray;
        } else if (isClassBreakStyleConfig(styleConfig.LineString)) {
          if (styleConfig.LineString.defaultSettings)
            layerStyle.LineString.defaultCanvas = this.createLineStringCanvas(
              this.processSimpleLineString(styleConfig.LineString.defaultSettings)
            );
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.LineString.classBreakStyleInfo.forEach((styleInfo) => {
            styleArray.push(this.createLineStringCanvas(this.processSimpleLineString(styleInfo.settings)));
          });
          layerStyle.LineString.arrayOfCanvas = styleArray;
        }
        resolve(layerStyle);
      }

      if (styleConfig.Polygon) {
        // ======================================================================================================================
        // Polygon style configuration ==========================================================================================
        layerStyle.Polygon = {};
        if (isSimpleStyleConfig(styleConfig.Polygon)) {
          layerStyle.Polygon.defaultCanvas = this.createPolygonCanvas(this.processSimplePolygon(styleConfig.Polygon));
        } else if (isUniqueValueStyleConfig(styleConfig.Polygon)) {
          if (styleConfig.Polygon.defaultSettings)
            layerStyle.Polygon.defaultCanvas = this.createPolygonCanvas(this.processSimplePolygon(styleConfig.Polygon.defaultSettings));
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.Polygon.uniqueValueStyleInfo.forEach((styleInfo) => {
            styleArray.push(this.createPolygonCanvas(this.processSimplePolygon(styleInfo.settings)));
          });
          layerStyle.Polygon.arrayOfCanvas = styleArray;
        } else if (isClassBreakStyleConfig(styleConfig.Polygon)) {
          if (styleConfig.Polygon.defaultSettings)
            layerStyle.Polygon.defaultCanvas = this.createPolygonCanvas(this.processSimplePolygon(styleConfig.Polygon.defaultSettings));
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.Polygon.classBreakStyleInfo.forEach((styleInfo) => {
            styleArray.push(this.createPolygonCanvas(this.processSimplePolygon(styleInfo.settings)));
          });
          layerStyle.Polygon.arrayOfCanvas = styleArray;
        }
        resolve(layerStyle);
      }
    });
    return promisedLayerStyle;
  }

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
  getFeatureStyle(
    feature: FeatureLike,
    layerEntryConfig: TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
  ): Style | undefined {
    let geometryType = feature.getGeometry()?.getType() as TypeStyleGeometry;
    geometryType = geometryType.startsWith('Multi') ? (geometryType.slice(5) as TypeStyleGeometry) : geometryType;
    // If style does not exist for the geometryType, create it.
    let { style } = layerEntryConfig as TypeVectorLayerEntryConfig;
    if (style === undefined || style[geometryType] === undefined)
      style = this.createDefaultStyle(geometryType, layerEntryConfig as TypeVectorLayerEntryConfig);
    // Get the style accordingly to its type and geometry.
    if (style![geometryType] !== undefined) {
      const styleSettings = style![geometryType]!;
      const { styleType } = styleSettings;
      return this.processStyle[styleType][geometryType].call(this, styleSettings, feature);
    }
    return undefined;
  }

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
  getClusterStyle(feature: FeatureLike, layerEntryConfig: TypeVectorLayerEntryConfig): Style | undefined {
    // If style does not exist for the geometryType, create it.
    const configSource = layerEntryConfig.source as TypeBaseSourceVectorInitialConfig;
    const textColor = configSource.cluster?.textColor !== undefined ? configSource.cluster?.textColor : '';
    let { style } = layerEntryConfig;

    // If settings exist for Geometry styles, use that stroke color, prioritizing point.
    if (style?.Point !== undefined) {
      this.setClusterColor(layerEntryConfig, style!.Point);
    }

    if (style?.Polygon !== undefined) {
      this.setClusterColor(layerEntryConfig, style!.Polygon);
    }

    if (style?.LineString !== undefined) {
      this.setClusterColor(layerEntryConfig, style!.LineString);
    }

    if (style === undefined || style.Point === undefined) {
      style = this.createDefaultClusterStyle(layerEntryConfig);
    }

    // Get the cluster point style if the feature is a cluster.
    if (style.Point !== undefined && feature.get('features').length > 1) {
      const styleSettings = (isSimpleStyleConfig(style.Point) ? style.Point.settings : style.Point) as TypeSimpleSymbolVectorConfig;

      if (styleSettings?.color === undefined && styleSettings.stroke?.color === undefined) {
        styleSettings.color =
          layerEntryConfig.source!.cluster?.color !== undefined
            ? asString(setAlphaColor(asArray(layerEntryConfig.source!.cluster!.color), 0.45))
            : this.getDefaultColorAndIncrementIndex(0.45);
      }

      this.setClusterColor(layerEntryConfig, styleSettings);
      const pointStyle = this.processClusterSymbol(styleSettings, feature, textColor);
      return pointStyle;
    }

    // When there is only a single feature left, use that features original geometry
    if (feature.get('features').length === 1) {
      const originalFeature = feature.get('features')[0];

      // If style does not exist for the geometryType, create it.
      if (originalFeature.getGeometry() instanceof LineString && style!.LineString === undefined) {
        const styleId = `${this.mapId}/${Layer.getLayerPath(layerEntryConfig)}`;
        let label = getLocalizedValue(layerEntryConfig.layerName, this.mapId);
        label = label !== undefined ? label : styleId;
        const settings: TypeLineStringVectorConfig = {
          type: 'lineString',
          stroke: {
            color: layerEntryConfig.source!.cluster!.color,
          },
        };
        const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
        layerEntryConfig.style!.LineString = styleSettings;
      }

      if (originalFeature.getGeometry() instanceof Polygon && style!.Polygon === undefined) {
        const styleId = `${this.mapId}/${Layer.getLayerPath(layerEntryConfig)}`;
        let label = getLocalizedValue(layerEntryConfig.layerName, this.mapId);
        label = label !== undefined ? label : styleId;
        const strokeColor = layerEntryConfig.source!.cluster?.color;
        const fillColor = asString(setAlphaColor(asArray(strokeColor!), 0.25));
        const settings: TypePolygonVectorConfig = {
          type: 'filledPolygon',
          color: fillColor,
          stroke: { color: strokeColor },
          fillStyle: 'solid',
        };
        const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
        layerEntryConfig.style!.Polygon = styleSettings;
      }

      return this.getFeatureStyle(originalFeature, layerEntryConfig);
    }

    if ('style' in layerEntryConfig) {
      return this.getFeatureStyle(feature, layerEntryConfig);
    }

    return undefined;
  }

  /** ***************************************************************************************************************************
   * Create a default style to use with a cluster feature that has no style configuration.
   *
   * @param { TypeVectorLayerEntryConfig} layerEntryConfig The layer entry config that may have a style configuration for the
   * feature. If style does not exist for the geometryType, create it.
   *
   * @returns {TypeStyleConfig} The style applied to the feature.
   */
  private createDefaultClusterStyle(layerEntryConfig: TypeVectorLayerEntryConfig): TypeStyleConfig {
    if (layerEntryConfig.style === undefined) layerEntryConfig.style = {};
    const styleId = `${this.mapId}/${Layer.getLayerPath(layerEntryConfig)}`;
    let label = getLocalizedValue(layerEntryConfig.layerName, this.mapId);
    label = label !== undefined ? label : styleId;
    const layerColor = layerEntryConfig.source?.cluster?.color ? layerEntryConfig.source?.cluster?.color : undefined;
    const settings: TypeSimpleSymbolVectorConfig = {
      type: 'simpleSymbol',
      color: layerColor ? asString(setAlphaColor(asArray(layerColor!), 0.45)) : this.getDefaultColor(0.45),
      stroke: {
        color: layerColor || this.getDefaultColorAndIncrementIndex(1),
        lineStyle: 'solid',
        width: 1,
      },
      symbol: 'circle',
    };
    if (layerEntryConfig.source!.cluster!.color === undefined) layerEntryConfig.source!.cluster!.color = settings.stroke!.color;
    const clusterStyleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
    layerEntryConfig.style.Point = clusterStyleSettings;
    return layerEntryConfig.style;
  }

  /** ***************************************************************************************************************************
   * Set the color in the layer cluster settings for clustered elements.
   *
   * @param { TypeVectorLayerEntryConfig} layerEntryConfig The layer entry config for the layer.
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the circle Style creation.
   *
   */
  private setClusterColor(layerEntryConfig: TypeVectorLayerEntryConfig, styleSettings: TypeStyleSettings | TypeKindOfVectorSettings) {
    const simpleSettings = (isSimpleStyleConfig(styleSettings) ? styleSettings.settings : styleSettings) as TypeSimpleSymbolVectorConfig;
    if (layerEntryConfig.source!.cluster!.color === undefined && simpleSettings.stroke?.color !== undefined) {
      layerEntryConfig.source!.cluster!.color = simpleSettings.stroke!.color;
    }
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
   * Process a cluster circle symbol using the settings.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the circle Style creation.
   * @param {FeatureLike} feature The feature that need its style to be defined.
   * @param {string} textColor The color to use for the cluster feature count.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processClusterSymbol(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature: FeatureLike,
    textColor?: string
  ): Style | undefined {
    const settings = (isSimpleStyleConfig(styleSettings) ? styleSettings.settings : styleSettings) as TypeSimpleSymbolVectorConfig;
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    const circleOptions: CircleOptions = { radius: settings.size !== undefined ? settings.size + 10 : 14 };
    circleOptions.stroke = new Stroke(strokeOptions);
    circleOptions.fill = new Fill(fillOptions);
    if (settings.offset !== undefined) circleOptions.displacement = settings.offset;
    if (settings.rotation !== undefined) circleOptions.rotation = settings.rotation;
    const textOptions: TextOptions = { text: feature.get('features').length.toString(), font: '12px sans-serif' };
    const textFillOptions: FillOptions = { color: textColor !== '' ? textColor : '#fff' };
    textOptions.fill = new Fill(textFillOptions);
    const textStrokeOptions: StrokeOptions = { color: '#000', width: 2 };
    textOptions.stroke = new Stroke(textStrokeOptions);
    return new Style({
      image: new StyleCircle(circleOptions),
      text: new Text(textOptions),
    });
  }

  /** ***************************************************************************************************************************
   * Process a simple point symbol using the settings. Simple point symbol may be an icon or a vector symbol.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The settings to use for the Style creation.
   * @param {FeatureLike} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processSimplePoint(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature?: FeatureLike): Style | undefined {
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
   * @param {FeatureLike} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processSimpleLineString(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature?: FeatureLike): Style | undefined {
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
   * @param {TypePolTypeStyleSettings | TypeKindOfVectorSettingsygonVectorConfig} styleSettings The settings to use for the
   * Style creation.
   * @param {FeatureLike} feature Optional feature. This method does not use it, it is there to have a homogeneous signature.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processSimplePolygon(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature?: FeatureLike): Style | undefined {
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
   * @param {FeatureLike} feature The feature used to test the unique value conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private searchUniqueValueEntry(
    fields: string[],
    uniqueValueStyleInfo: TypeUniqueValueStyleInfo[],
    feature: FeatureLike
  ): number | undefined {
    for (let i = 0; i < uniqueValueStyleInfo.length; i++) {
      for (let j = 0; j < fields.length; j++) {
        // For obscure reasons, it seems that sometimes the field names in the feature do not have the same case as those in the
        // unique value definition.
        const featureKey = (feature as Feature).getKeys().filter((key) => {
          return key.toLowerCase() === fields[j].toLowerCase();
        });
        // eslint-disable-next-line eqeqeq
        if (featureKey.length && feature.get(featureKey[0]) == uniqueValueStyleInfo[i].values[j] && j + 1 === fields.length) return i;
      }
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the unique value settings using a point feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {FeatureLike} feature the feature used to test the unique value conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processUniqueValuePoint(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
      if (i !== undefined && uniqueValueStyleInfo[i].visible) return this.processSimplePoint(uniqueValueStyleInfo[i].settings);
      if (defaultSettings !== undefined && styleSettings.defaultVisible && i === undefined) return this.processSimplePoint(defaultSettings);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the unique value settings using a lineString feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {FeatureLike} feature the feature used to test the unique value conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processUniqueLineString(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
      if (i !== undefined && uniqueValueStyleInfo[i].visible)
        return this.processSimpleLineString(uniqueValueStyleInfo[i].settings, feature);
      if (defaultSettings !== undefined && styleSettings.defaultVisible && i === undefined)
        return this.processSimpleLineString(defaultSettings, feature);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the unique value settings using a polygon feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {FeatureLike} feature the feature used to test the unique value conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processUniquePolygon(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
      if (i !== undefined && uniqueValueStyleInfo[i].visible) {
        return this.processSimplePolygon(uniqueValueStyleInfo[i].settings, feature);
      }
      if (defaultSettings !== undefined && styleSettings.defaultVisible && i === undefined)
        return this.processSimplePolygon(defaultSettings, feature);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Search the class breakentry using the field value stored in the feature.
   *
   * @param {string[]} field The field involved in the class break definition.
   * @param {TypeClassBreakStyleInfo[]} classBreakStyleInfo The class break configuration.
   * @param {FeatureLike} feature The feature used to test the class break conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private searchClassBreakEntry(field: string, classBreakStyleInfo: TypeClassBreakStyleInfo[], feature: FeatureLike): number | undefined {
    // For obscure reasons, it seems that sometimes the field names in the feature do not have the same case as those in the
    // class break definition.
    const featureKey = (feature as Feature).getKeys().filter((key) => {
      return key.toLowerCase() === field.toLowerCase();
    });
    if (featureKey.length !== 1) return undefined;

    const fieldValue = feature.get(featureKey[0]) as number;

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
   * @param {FeatureLike} feature the feature used to test the unique value conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processClassBreaksPoint(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfo } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfo, feature);
      if (i !== undefined && classBreakStyleInfo[i].visible) return this.processSimplePoint(classBreakStyleInfo[i].settings);
      if (defaultSettings !== undefined && styleSettings.defaultVisible && i === undefined) return this.processSimplePoint(defaultSettings);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the class break settings using a lineString feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {FeatureLike} feature the feature used to test the unique value conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processClassBreaksLineString(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature: FeatureLike
  ): Style | undefined {
    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfo } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfo, feature);
      if (i !== undefined && classBreakStyleInfo[i].visible) return this.processSimpleLineString(classBreakStyleInfo[i].settings, feature);
      if (defaultSettings !== undefined && styleSettings.defaultVisible && i === undefined)
        return this.processSimpleLineString(defaultSettings, feature);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Process the class break settings using a Polygon feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings The style settings to use.
   * @param {FeatureLike} feature the feature used to test the unique value conditions.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   */
  private processClassBreaksPolygon(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfo } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfo, feature);
      if (i !== undefined && classBreakStyleInfo[i].visible) return this.processSimplePolygon(classBreakStyleInfo[i].settings, feature);
      if (defaultSettings !== undefined && styleSettings.defaultVisible && i === undefined)
        return this.processSimplePolygon(defaultSettings, feature);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Create a default style to use with a vector feature that has no style configuration.
   *
   * @param {TypeStyleGeometry} geometryType The type of geometry (Point, LineString, Polygon).
   * @param {TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig} layerEntryConfig the layer entry config to configure.
   *
   * @returns {TypeStyleConfig | undefined} The Style configurationcreated. Undefined if unable to create it.
   */
  private createDefaultStyle(
    geometryType: TypeStyleGeometry,
    layerEntryConfig: TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
  ): TypeStyleConfig | undefined {
    if (layerEntryConfig.style === undefined) layerEntryConfig.style = {};
    const styleId = `${this.mapId}/${Layer.getLayerPath(layerEntryConfig)}`;
    let label = getLocalizedValue(layerEntryConfig.layerName, this.mapId);
    label = label !== undefined ? label : styleId;
    if (geometryType === 'Point') {
      const settings: TypeSimpleSymbolVectorConfig = {
        type: 'simpleSymbol',
        color: this.getDefaultColor(0.25),
        stroke: {
          color: this.getDefaultColor(1),
          lineStyle: 'solid',
          width: 1,
        },
        symbol: 'circle',
      };
      const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
      layerEntryConfig.style[geometryType] = styleSettings;
      this.incrementDefaultColorIndex();
      return layerEntryConfig.style;
    }
    if (geometryType === 'LineString') {
      const settings: TypeLineStringVectorConfig = {
        type: 'lineString',
        stroke: { color: this.getDefaultColor(1) },
      };
      const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
      layerEntryConfig.style[geometryType] = styleSettings;
      this.incrementDefaultColorIndex();
      return layerEntryConfig.style;
    }
    if (geometryType === 'Polygon') {
      const settings: TypePolygonVectorConfig = {
        type: 'filledPolygon',
        color: this.getDefaultColor(0.25),
        stroke: { color: this.getDefaultColor(1) },
        fillStyle: 'solid',
      };
      const styleSettings: TypeSimpleStyleConfig = { styleId, styleType: 'simple', label, settings };
      layerEntryConfig.style[geometryType] = styleSettings;
      this.incrementDefaultColorIndex();
      return layerEntryConfig.style;
    }
    // eslint-disable-next-line no-console
    console.log(`Geometry type ${geometryType} is not supported by the GeoView viewer.`);
    return undefined;
  }
}
