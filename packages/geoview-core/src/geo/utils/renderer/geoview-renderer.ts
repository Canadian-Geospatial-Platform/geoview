import { asArray, asString } from 'ol/color';
import { Style, Stroke, Fill, RegularShape, Circle as StyleCircle, Icon as StyleIcon, Text, Circle } from 'ol/style';
import type { Geometry } from 'ol/geom';
import { LineString, Point, Polygon } from 'ol/geom';
import type { Options as IconOptions } from 'ol/style/Icon';
import Icon from 'ol/style/Icon';
import type { Options as CircleOptions } from 'ol/style/Circle';
import type { Options as RegularShapeOptions } from 'ol/style/RegularShape';
import type { Options as StrokeOptions } from 'ol/style/Stroke';
import type { Options as FillOptions } from 'ol/style/Fill';
import type { FeatureLike } from 'ol/Feature';
import type Feature from 'ol/Feature';
import { toContext } from 'ol/render';

import { setAlphaColor } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import type {
  TypeLayerStyleConfigType,
  TypeFillStyle,
  TypePolygonVectorConfig,
  TypeIconSymbolVectorConfig,
  TypeLineStyle,
  TypeLineStringVectorConfig,
  TypeSimpleSymbolVectorConfig,
  TypeSymbol,
  TypeKindOfVectorSettings,
  TypeStyleGeometry,
  TypeLayerStyleSettings,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigInfo,
  TypeLayerStyleValueCondition,
  TypeLayerTextConfig,
  TypeLayerStyleVisualVariable,
  TypeAliasLookup,
  TypeValidMapProjectionCodes,
  codedValueType,
  TypeOutfields,
} from '@/api/types/map-schema-types';
import {
  isFilledPolygonVectorConfig,
  isIconSymbolVectorConfig,
  isLineStringVectorConfig,
  isSimpleSymbolVectorConfig,
} from '@/api/types/map-schema-types';
import type { TypeLayerMetadataFields } from '@/api/types/layer-schema-types';
import type { FillPatternLine, FillPatternSettings, FilterNodeType } from './geoview-renderer-types';
import { binaryKeywors, defaultColor, groupKeywords, NodeType, operatorPriority, unaryKeywords } from './geoview-renderer-types';
import type { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { logger } from '@/core/utils/logger';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

type TypeStyleProcessor = (
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  options?: TypeStyleProcessorOptions
) => Style | undefined;

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

/** Default value of the legend canvas width when the settings do not provide one. */
const LEGEND_CANVAS_WIDTH = 50;

/** Default value of the legend canvas height when the settings do not provide one. */
const LEGEND_CANVAS_HEIGHT = 50;

let colorCount = 0;

export abstract class GeoviewRenderer {
  // The default filter when all should be included
  static DEFAULT_FILTER_1EQUALS1: string = '(1=1)';
  static DEFAULT_FILTER_1EQUALS0: string = '(1=0)';

  /**
   * Get the default color using the default color index.
   *
   * @param {number} alpha - Alpha value to associate to the color.
   * @param {boolean} increment - True, if we want to skip to next color
   *
   * @returns {string} The current default color string.
   * @static
   */
  // TODO: MINOR - Create a mechanism to have one counter by map if needed with a small class who reuse the static function
  static getDefaultColor(alpha: number, increment: boolean = false): string {
    // get color then increment if needed
    const color = asString(setAlphaColor(asArray(defaultColor[colorCount]), alpha));
    if (increment) colorCount++;
    return color;
  }

  /**
   * This method returns the type of geometry. It removes the Multi prefix because for the geoviewRenderer, a MultiPoint has
   * the same behaviour than a Point.
   *
   * @param {FeatureLike} feature - The feature to check
   *
   * @returns {TypeStyleGeometry} The type of geometry (Point, LineString, Polygon).
   * @static
   */
  static getGeometryType(feature: FeatureLike): TypeStyleGeometry {
    const geometryType = feature.getGeometry()?.getType();
    if (!geometryType) throw new Error('Features must have a geometry type.');
    return (geometryType.startsWith('Multi') ? geometryType.slice(5) : geometryType) as TypeStyleGeometry;
  }

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
  static base64ToSVGString(base64: string): string {
    if (!base64) return base64;

    // Split the parameters (e.g. ?fill=...&outline=...)
    const [basePart, queryString] = base64.split('?');
    const b64 = basePart.replace(/^base64:/, '');
    let svgText = window.atob(b64);

    // Decode and parse the parameters
    const params = new URLSearchParams(queryString ?? '');
    for (const [key, value] of params.entries()) {
      // For example: replace param(fill) with "#000000"
      const decodedVal = decodeURIComponent(value);
      svgText = svgText.replace(new RegExp(`param\\(${key}\\)`, 'g'), decodedVal);
    }

    // Fix QGIS stroke property not being spaced correctly...
    svgText = svgText.replace('"stroke=', '" stroke=');

    // Fix QGIS stroke-opacity/fill-opacity having wrong values...
    svgText = svgText.replace(/(stroke-opacity|fill-opacity|stroke-width)="([\d.]+)\s+[\d.]+"/g, '$1="$2"');

    // Replace extra QGIS meta stuff
    svgText = svgText
      .replace(/<title>.*?<\/title>/gi, '')
      .replace(/<desc>.*?<\/desc>/gi, '')
      .replace(/<defs>\s*<\/defs>/gi, '')
      .replace(/\s{2,}/g, ' ');

    // Remove XML header if present (can cause EncodingError)
    svgText = svgText.replace(/<\?xml[^>]*>\s*/i, '');

    // Return final
    return svgText.trim();
  }

  /**
   * Encodes an SVG XML string into a base64-encoded string.
   * This is the inverse of {@link base64ToSVGString}, allowing you to safely
   * embed or transmit SVG data in formats where raw XML is not permitted.
   * @param {string} svgXML - The raw SVG XML string to encode.
   * @returns {string} A base64-encoded representation of the SVG string.
   * @static
   */
  static SVGStringToBase64(svgXML: string): string {
    return window.btoa(svgXML);
  }

  /**
   * This method loads the image of an icon that compose the legend.
   *
   * @param {string} src - Source information (base64 image) of the image to load.
   *
   * @returns {Promise<HTMLImageElement>} A promise that the image is loaded.
   * @static
   */
  static loadImage(src: string): Promise<HTMLImageElement | null> {
    const promisedImage = new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.src = src;
      image
        .decode()
        .then(() => resolve(image))
        .catch((error: unknown) => {
          logger.logError('this.loadImage(src) - Error while loading the src image =', src, error);
          resolve(null);
        });
    });
    return promisedImage;
  }

  /**
   * This method creates a canvas with the image of an icon that is defined in the point style.
   *
   * @param {Style} pointStyle - Style associated to the point symbol.
   *
   * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
   * @static
   */
  static async createIconCanvas(pointStyle?: Style): Promise<HTMLCanvasElement | null> {
    try {
      const iconStyle = pointStyle?.getImage() as Icon;
      const image = await this.loadImage(iconStyle.getSrc()!);
      if (image) {
        const size = iconStyle.getSize();
        const width = Array.isArray(size) ? size[0] : image.width || LEGEND_CANVAS_WIDTH;
        const height = Array.isArray(size) ? size[1] : image.height || LEGEND_CANVAS_HEIGHT;
        const drawingCanvas = document.createElement('canvas');
        drawingCanvas.width = width;
        drawingCanvas.height = height;
        const drawingContext = drawingCanvas.getContext('2d', { willReadFrequently: true })!;
        drawingContext.globalAlpha = iconStyle.getOpacity();
        drawingContext.drawImage(image, 0, 0);
        return drawingCanvas;
      }
      return null;
    } catch (error: unknown) {
      logger.logError(`Error creating incon canvas for pointStyle`, error);
      return null;
    }
  }

  // #region CREATE CANVAS

  /**
   * This method creates a canvas with the vector point settings that are defined in the point style.
   *
   * @param {Style} pointStyle - Style associated to the point symbol.
   *
   * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
   * @static
   */
  static createPointCanvas(pointStyle?: Style): HTMLCanvasElement {
    const size = pointStyle?.getImage()?.getSize();
    const [width, height] = Array.isArray(size) ? size : [LEGEND_CANVAS_WIDTH, LEGEND_CANVAS_HEIGHT];
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = width + 4;
    drawingCanvas.height = height + 4;
    const drawingContext = toContext(drawingCanvas.getContext('2d', { willReadFrequently: true })!);
    if (pointStyle) drawingContext.setStyle(pointStyle);
    drawingContext.setTransform([1, 0, 0, 1, 0, 0]);
    drawingContext.drawGeometry(new Point([drawingCanvas.width / 2, drawingCanvas.width / 2]));
    return drawingCanvas;
  }

  /**
   * This method creates a canvas with the lineString settings that are defined in the style.
   *
   * @param {Style} lineStringStyle - Style associated to the lineString.
   *
   * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
   * @static
   */
  static createLineStringCanvas(lineStringStyle?: Style): HTMLCanvasElement {
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = LEGEND_CANVAS_WIDTH;
    drawingCanvas.height = LEGEND_CANVAS_HEIGHT;
    const context = drawingCanvas.getContext('2d', { willReadFrequently: true })!;
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

  /**
   * This method creates a canvas with the polygon settings that are defined in the style.
   *
   * @param {Style} polygonStyle - Style associated to the polygon.
   *
   * @returns {Promise<HTMLCanvasElement>} A promise that the canvas is created.
   * @static
   */
  static createPolygonCanvas(polygonStyle?: Style): HTMLCanvasElement {
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = LEGEND_CANVAS_WIDTH;
    drawingCanvas.height = LEGEND_CANVAS_HEIGHT;
    const context = drawingCanvas.getContext('2d', { willReadFrequently: true })!;
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

    context.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
    return drawingCanvas;
  }

  // #endregion CREATE CANVAS

  /**
   * Create the stroke options using the specified settings.
   *
   * @param {TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig} settings - Settings to use
   * for the stroke options creation.
   *
   * @returns {StrokeOptions} The stroke options created.
   * @static
   */
  static createStrokeOptions(settings: TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig): StrokeOptions {
    // eslint-disable-next-line no-param-reassign
    if (settings.stroke === undefined) settings.stroke = {};
    if (settings.stroke.color === undefined) {
      if ('color' in settings)
        // eslint-disable-next-line no-param-reassign
        settings.stroke.color = asString(setAlphaColor(asArray((settings as TypeSimpleSymbolVectorConfig).color!), 1));
      // eslint-disable-next-line no-param-reassign
      else settings.stroke.color = this.getDefaultColor(1, true);
    }

    const strokeOptions: StrokeOptions = {
      color: settings.stroke?.color,
      width: settings.stroke?.width,
      lineCap: settings.stroke?.lineCap || 'round',
      lineJoin: settings.stroke?.lineJoin || 'bevel',
      lineDash:
        settings.stroke?.lineDash || this.lineDashSettings[settings.stroke?.lineStyle !== undefined ? settings.stroke?.lineStyle : 'solid'],
    };
    return strokeOptions;
  }

  /**
   * Execute an operator using the nodes on the data stack. The filter equation is evaluated using a postfix notation. The result
   * is pushed back on the data stack. If a problem is detected, an error object is thrown with an explanatory message.
   *
   * @param {FilterNodeType} operator - Operator to execute.
   * @param {FilterNodeType[]} dataStack - Data stack to use for the operator execution.
   * @static
   */
  static executeOperator(operator: FilterNodeType, dataStack: FilterNodeType[]): void {
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
              const value = operand1.nodeValue;
              const likePattern = operand2.nodeValue;

              // Escape all RegExp metacharacters except SQL wildcards
              const escapedPattern = likePattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

              // Convert SQL LIKE wildcards to RegExp equivalents
              const regexPattern = '^' + escapedPattern.replaceAll('%', '.*').replaceAll('_', '.') + '$';

              // Case-insensitive match and multiline
              const regex = new RegExp(regexPattern, 'is');

              const matches = value && regex.test(value);

              dataStack.push({
                nodeType: NodeType.variable,
                nodeValue: matches,
              });
            }
            break;
          case ',':
            valueToPush = {
              nodeType: NodeType.variable,
              nodeValue: Array.isArray(operand2.nodeValue)
                ? ([operand1.nodeValue].concat(operand2.nodeValue) as string[] | number[])
                : ([operand1.nodeValue, operand2.nodeValue] as string[] | number[]),
            };
            if (typeof valueToPush.nodeValue[0] !== typeof valueToPush.nodeValue[1]) throw new Error(`IN clause can't mix types`);
            dataStack.push(valueToPush);
            break;
          case 'in':
            if (Array.isArray(operand2.nodeValue))
              dataStack.push({
                nodeType: NodeType.variable,
                nodeValue: operand2.nodeValue.includes(operand1.nodeValue as never),
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
              operand.nodeValue = DateMgt.applyInputDateFormat(operand.nodeValue);
              dataStack.push({
                nodeType: NodeType.variable,
                nodeValue: DateMgt.convertToMilliseconds(DateMgt.convertToUTC(operand.nodeValue)),
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
            throw new NotSupportedError(`unknown operator error`);
        }
      }
    }
  }

  /**
   * Use the filter equation and the feature fields to determine if the feature is visible.
   *
   * @param {Feature} feature - Feature used to find the visibility value to return.
   * @param {FilterNodeType[]} filterEquation - Filter used to find the visibility value to return.
   *
   * @returns {boolean | undefined} The visibility flag for the feature specified.
   * @static
   */
  static featureIsNotVisible(feature: Feature, filterEquation: FilterNodeType[]): boolean | undefined {
    const operatorStack: FilterNodeType[] = [];
    const dataStack: FilterNodeType[] = [];

    const operatorAt = (index: number, stack: FilterNodeType[]): FilterNodeType | undefined => {
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
    } catch (error: unknown) {
      throw new Error(`Invalid vector layer filter (${error}.`);
    }
    if (dataStack.length !== 1 || dataStack[0].nodeType !== NodeType.variable)
      throw new Error(`Invalid vector layer filter (invalid structure).`);
    const dataStackTop = dataStack.pop();
    return dataStackTop ? !(dataStackTop.nodeValue as boolean) : undefined;
  }

  // #region PROCESS RENDERER

  /**
   * Process a circle symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processCircleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    // eslint-disable-next-line no-param-reassign
    if (settings.color === undefined) settings.color = this.getDefaultColor(0.25, true);
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
  static processStarShapeSymbol(settings: TypeSimpleSymbolVectorConfig, points: number, angle: number): Style | undefined {
    // eslint-disable-next-line no-param-reassign
    if (settings.color === undefined) settings.color = this.getDefaultColor(0.25, true);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    const regularShapeOptions: RegularShapeOptions = {
      radius: settings.size !== undefined ? settings.size : 6,
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

  /**
   * Process a star symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processStarSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 5, 0);
  }

  /**
   * Process a X symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processXSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 4, Math.PI / 4);
  }

  /**
   * Process a + symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processPlusSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 4, 0);
  }

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
  static processRegularShape(
    settings: TypeSimpleSymbolVectorConfig,
    points: number,
    angle: number,
    scale: [number, number]
  ): Style | undefined {
    // eslint-disable-next-line no-param-reassign
    if (settings.color === undefined) settings.color = this.getDefaultColor(0.25, true);
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

  /**
   * Process a square symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processSquareSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 4, Math.PI / 4, [1, 1]);
  }

  /**
   * Process a Diamond symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processDiamondSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 4, 0, [0.75, 1]);
  }

  /**
   * Process a triangle symbol using the settings.
   *
   * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processTriangleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 3, 0, [1, 1]);
  }

  /**
   * Process an icon symbol using the settings.
   *
   * @param {TypeIconSymbolVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processIconSymbol(settings: TypeIconSymbolVectorConfig): Style | undefined {
    const iconOptions: IconOptions = {};
    iconOptions.src = `data:${settings.mimeType};base64,${settings.src}`;
    if (settings.width !== undefined && settings.height !== undefined) iconOptions.size = [settings.width, settings.height];
    if (settings.offset !== undefined) iconOptions.offset = settings.offset;
    if (settings.rotation !== undefined) iconOptions.rotation = settings.rotation;
    if (settings.opacity !== undefined) iconOptions.opacity = settings.opacity;
    if (settings.scale !== undefined) iconOptions.scale = settings.scale;
    return new Style({
      image: new StyleIcon(iconOptions),
    });
  }

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
  static processSimplePoint(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, visualVariables } = options || {};

    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;

    const settings = (styleSettings.type === 'simple' ? styleSettings.info[0].settings : styleSettings) as TypeKindOfVectorSettings;
    let style: Style | undefined;
    if (isSimpleSymbolVectorConfig(settings)) {
      const { symbol } = settings;
      style = this.#processSymbol[symbol](settings);
    } else if (isIconSymbolVectorConfig(settings)) {
      style = this.processIconSymbol(settings);
    }

    // Apply visual variables if feature and style exist
    const visualVarsToApply = visualVariables || ('visualVariables' in styleSettings ? styleSettings.visualVariables : undefined);

    if (style && feature && visualVarsToApply) {
      style = this.#applyVisualVariables(style, feature, visualVarsToApply);
    }

    return style;
  }

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
  static processSimpleLineString(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, visualVariables } = options || {};

    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;

    const settings = (styleSettings.type === 'simple' ? styleSettings.info[0].settings : styleSettings) as TypeKindOfVectorSettings;
    let geometry;
    if (feature) {
      geometry = feature.getGeometry() as Geometry;
    }
    let style: Style | undefined;
    if (isLineStringVectorConfig(settings)) {
      const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
      style = new Style({ stroke: new Stroke(strokeOptions), geometry });
    }

    // Apply visual variables if feature and style exist
    const visualVarsToApply = visualVariables || ('visualVariables' in styleSettings ? styleSettings.visualVariables : undefined);

    if (style && feature && visualVarsToApply) {
      style = this.#applyVisualVariables(style, feature, visualVarsToApply);
    }

    return style;
  }

  /**
   * Process a simple solid fill (polygon) using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processSolidFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    // eslint-disable-next-line no-param-reassign
    if (settings.color === undefined) settings.color = this.getDefaultColor(0.25, true);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
      geometry,
    });
  }

  /**
   * Process a null fill (polygon with fill opacity = 0) using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processNullFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    // eslint-disable-next-line no-param-reassign
    if (settings.color === undefined) settings.color = this.getDefaultColor(0, true);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
      geometry,
    });
  }

  /**
   * Process a pattern fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   * @param {FillPatternLine[]} FillPatternLines - Fill pattern lines needed to create the fill.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processPatternFill(
    settings: TypePolygonVectorConfig,
    FillPatternLines: FillPatternLine[],
    geometry?: Geometry
  ): Style | undefined {
    // Depending on the pattern
    const patternSize = settings.patternSize ?? 8;
    const patternWidth = settings.patternWidth ?? 16;

    // eslint-disable-next-line no-param-reassign
    if (settings.color === undefined) settings.color = this.getDefaultColor(0.25, true);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);

    // Canvas used to create the pattern fill. It is bigger to take into account the repeating aspect of the fill.
    const drawingCanvas = document.createElement('canvas');
    const context = drawingCanvas.getContext('2d', { willReadFrequently: true })!;

    // If fill style is a dot
    if (settings.fillStyle === 'dot') {
      const tileSpace = patternSize + patternWidth;
      drawingCanvas.width = tileSpace;
      drawingCanvas.height = tileSpace;

      // Draw the dot
      context.fillStyle = settings.color!;
      context.beginPath();
      context.arc(tileSpace / 2, tileSpace / 2, patternSize / 2, 0, 2 * Math.PI);
      context.fill();

      fillOptions.color = context.createPattern(drawingCanvas, 'repeat')!;
    } else {
      // Set the canvas width/height
      drawingCanvas.width = patternSize * 2;
      drawingCanvas.height = patternSize * 2;

      context.strokeStyle = settings.color;
      context.lineCap = 'round';
      context.lineWidth = settings.patternWidth ?? 1;
      context.beginPath();
      for (let i = 0; i < FillPatternLines.length; i++) {
        const { moveTo, lineTo } = FillPatternLines[i];
        context.moveTo(moveTo[0] * patternSize, moveTo[1] * patternSize);
        context.lineTo(lineTo[0] * patternSize, lineTo[1] * patternSize);
      }
      context.stroke();

      // extract the sub area that will define the pattern that will repeat properly.
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = patternSize;
      outputCanvas.height = patternSize;
      const outputContext = outputCanvas.getContext('2d', { willReadFrequently: true })!;
      outputContext.putImageData(context.getImageData(patternSize / 2, patternSize / 2, patternSize, patternSize), 0, 0);

      fillOptions.color = outputContext.createPattern(outputCanvas, 'repeat');
    }

    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
      geometry,
    });
  }

  /**
   * Process a backward diagonal fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processBackwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPatternFill(settings, this.FillPatternSettings.backwardDiagonal, geometry);
  }

  /**
   * Process a forward diagonal fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processForwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPatternFill(settings, this.FillPatternSettings.forwardDiagonal, geometry);
  }

  /**
   * Process a cross fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPatternFill(settings, this.FillPatternSettings.cross, geometry);
  }

  /**
   * Process a diagonal cross fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processDiagonalCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPatternFill(settings, this.FillPatternSettings.diagonalCross, geometry);
  }

  /**
   * Process a horizontal fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processHorizontalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPatternFill(settings, this.FillPatternSettings.horizontal, geometry);
  }

  /**
   * Process a vertical fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processVerticalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPatternFill(settings, this.FillPatternSettings.vertical, geometry);
  }

  /**
   * Process a dot fill using the settings.
   *
   * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
   *
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processDotFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
    return this.processPatternFill(settings, this.FillPatternSettings.dot, geometry);
  }

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
  static processSimplePolygon(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, visualVariables } = options || {};

    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;

    const settings = (styleSettings.type === 'simple' ? styleSettings.info[0].settings : styleSettings) as TypeKindOfVectorSettings;
    let geometry;
    if (feature) {
      geometry = feature.getGeometry() as Geometry;
    }
    let style: Style | undefined;
    if (isFilledPolygonVectorConfig(settings)) {
      const { fillStyle } = settings; // TODO: refactor - introduce by moving to config map schema type
      if (geometry !== undefined) {
        style = this.#processFillStyle[fillStyle](settings, geometry);
      } else {
        style = this.#processFillStyle[fillStyle](settings);
      }
    }

    // Apply visual variables if feature and style exist
    const visualVarsToApply = visualVariables || ('visualVariables' in styleSettings ? styleSettings.visualVariables : undefined);

    if (style && feature && visualVarsToApply) {
      style = this.#applyVisualVariables(style, feature, visualVarsToApply);
    }

    return style;
  }

  // #endregion PROCESS RENDERER

  /**
   * This method is used to process the array of point styles as described in the pointStyleConfig.
   *
   * @param {TypeVectorLayerStyles} layerStyle - Object that will receive the created canvas.
   * @param {TypeLayerStyleConfigInfo[]} arrayOfPointStyleConfig - Array of point style configuration.
   * @returns {Promise<TypeVectorLayerStyles>} A promise that the vector layer style is created.
   * @static
   */
  static async processArrayOfPointStyleConfig(
    layerStyles: TypeVectorLayerStyles,
    arrayOfPointStyleConfig: TypeLayerStyleConfigInfo[]
  ): Promise<TypeVectorLayerStyles> {
    try {
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
      const listOfCanvasCreated = await Promise.all(promiseOfCanvasCreated);
      listOfCanvasCreated.forEach((canvas) => {
        styleArray.push(canvas);
      });
      return layerStyles;
    } catch (error: unknown) {
      logger.logError('Error processing array of point styles', error);
      return {} as TypeVectorLayerStyles;
    }
  }

  /**
   * This method is a private sub routine used by the getLegendStyles method to gets the style of the layer as specified by the
   * style configuration.
   *
   * @param {TypeKindOfVectorSettings | undefined} defaultSettings - Settings associated to simple styles or default style of
   * unique value and class break styles. When this parameter is undefined, no defaultCanvas is created.
   * @param {TypeLayerStyleConfigInfo[] | undefined} arrayOfPointStyleConfig - Array of point style
   * configuration associated to unique value and class break styles. When this parameter is undefined, no arrayOfCanvas is
   * created.
   *
   * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
   * @static @private
   */
  static async #getPointStyleSubRoutine(
    defaultSettings?: TypeKindOfVectorSettings,
    arrayOfPointStyleConfig?: TypeLayerStyleConfigInfo[]
  ): Promise<TypeVectorLayerStyles> {
    try {
      const layerStyles: TypeVectorLayerStyles = { Point: {} };
      if (defaultSettings) {
        if (isIconSymbolVectorConfig(defaultSettings)) {
          // Icon symbol ======================================================================================
          const canvas = await this.createIconCanvas(this.processSimplePoint(defaultSettings));
          layerStyles.Point!.defaultCanvas = canvas;
          if (arrayOfPointStyleConfig) {
            layerStyles.Point!.arrayOfCanvas = [];
            const processedStyles = await this.processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig);
            processedStyles.Point?.arrayOfCanvas?.pop();
            return processedStyles;
          }
          return layerStyles;
        }

        // Simple vector symbol =============================================================================
        layerStyles.Point!.defaultCanvas = this.createPointCanvas(this.processSimplePoint(defaultSettings));
        if (arrayOfPointStyleConfig) {
          layerStyles.Point!.arrayOfCanvas = [];
          const processedStyles = await this.processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig);
          processedStyles.Point?.arrayOfCanvas?.pop();
          return processedStyles;
        }
        return layerStyles;
      }

      layerStyles.Point!.arrayOfCanvas = [];
      return await this.processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig!);
    } catch (error: unknown) {
      logger.logError('Error getPointStyle sub routine', error);
      return {} as TypeVectorLayerStyles;
    }
  }

  /**
   * This method gets the legend styles used by the the layer as specified by the style configuration.
   *
   * @param {TypeStyleConfig} styleConfig - The style configuration.
   *
   * @returns {Promise<TypeVectorLayerStyles>} A promise that the layer styles are processed.
   * @static
   */
  static async getLegendStyles(styleConfig: TypeLayerStyleConfig | undefined): Promise<TypeVectorLayerStyles> {
    try {
      if (!styleConfig) return {};
      const legendStyles: TypeVectorLayerStyles = {};

      if (styleConfig.Point) {
        // ======================================================================================================================
        // Point style configuration ============================================================================================
        if (styleConfig.Point.type === 'simple') {
          const layerStyles = await this.#getPointStyleSubRoutine(styleConfig.Point.info[0].settings);
          legendStyles.Point = layerStyles.Point;
        } else {
          const defaultSettings = styleConfig.Point.hasDefault
            ? styleConfig.Point.info[styleConfig.Point.info.length - 1].settings
            : undefined;
          const layerStyles = await this.#getPointStyleSubRoutine(defaultSettings, styleConfig.Point.info);
          legendStyles.Point = layerStyles.Point;
        }
      }

      if (styleConfig.LineString) {
        // ======================================================================================================================
        // LineString style configuration =======================================================================================
        const layerStyles: TypeVectorLayerStyles = { LineString: {} };
        if (styleConfig.LineString.type === 'simple') {
          layerStyles.LineString!.defaultCanvas = this.createLineStringCanvas(this.processSimpleLineString(styleConfig.LineString));
        } else {
          if (styleConfig.LineString.hasDefault)
            layerStyles.LineString!.defaultCanvas = this.createLineStringCanvas(
              this.processSimpleLineString(styleConfig.LineString.info[styleConfig.LineString.info.length - 1].settings)
            );
          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.LineString.info.forEach((styleInfo) => {
            styleArray.push(this.createLineStringCanvas(this.processSimpleLineString(styleInfo.settings)));
          });
          if (styleConfig.LineString.hasDefault) styleArray.pop();
          layerStyles.LineString!.arrayOfCanvas = styleArray;
        }
        legendStyles.LineString = layerStyles.LineString;
      }

      if (styleConfig.Polygon) {
        // ======================================================================================================================
        // Polygon style configuration ==========================================================================================
        const layerStyles: TypeVectorLayerStyles = { Polygon: {} };
        if (styleConfig.Polygon.type === 'simple') {
          layerStyles.Polygon!.defaultCanvas = this.createPolygonCanvas(this.processSimplePolygon(styleConfig.Polygon.info[0].settings));
        } else {
          if (styleConfig.Polygon.hasDefault)
            layerStyles.Polygon!.defaultCanvas = this.createPolygonCanvas(
              this.processSimplePolygon(styleConfig.Polygon.info[styleConfig.Polygon.info.length - 1].settings)
            );

          const styleArray: HTMLCanvasElement[] = [];
          styleConfig.Polygon.info.forEach((styleInfo) => {
            styleArray.push(this.createPolygonCanvas(this.processSimplePolygon(styleInfo.settings)));
          });
          if (styleConfig.Polygon.hasDefault) styleArray.pop();
          layerStyles.Polygon!.arrayOfCanvas = styleArray;
        }

        legendStyles.Polygon = layerStyles.Polygon;
      }
      return legendStyles;
    } catch (error: unknown) {
      logger.logError('Error getLegendStyles', error);
      return {};
    }
  }

  /**
   * Create a default style to use with a vector feature that has no style configuration.
   *
   * @param {TypeStyleGeometry} geometryType - Type of geometry (Point, LineString, Polygon).
   * @param {string} label - Label for the style.
   *
   * @returns {TypeLayerStyleConfigInfo | undefined} The Style configuration created. Undefined if unable to create it.
   * @static
   */
  static createDefaultStyle(geometryType: TypeStyleGeometry, label: string): TypeLayerStyleSettings | undefined {
    if (geometryType === 'Point') {
      const settings: TypeSimpleSymbolVectorConfig = {
        type: 'simpleSymbol',
        color: this.getDefaultColor(0.25),
        stroke: {
          color: this.getDefaultColor(1, true),
          lineStyle: 'solid',
          width: 1,
        },
        symbol: 'circle',
      };
      return { type: 'simple', hasDefault: false, fields: [], info: [{ visible: true, label, settings, values: [] }] };
    }
    if (geometryType === 'LineString') {
      const settings: TypeLineStringVectorConfig = {
        type: 'lineString',
        stroke: { color: this.getDefaultColor(1, true) },
      };
      return { type: 'simple', hasDefault: false, fields: [], info: [{ visible: true, label, settings, values: [] }] };
    }
    if (geometryType === 'Polygon') {
      const settings: TypePolygonVectorConfig = {
        type: 'filledPolygon',
        color: this.getDefaultColor(0.25),
        stroke: { color: this.getDefaultColor(1, true) },
        fillStyle: 'solid',
      };
      return { type: 'simple', hasDefault: false, fields: [], info: [{ visible: true, label, settings, values: [] }] };
    }
    logger.logError(`Geometry type ${geometryType} is not supported by the GeoView viewer.`);
    return undefined;
  }

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
  static interpolateValue(value: number, value1: number, value2: number, output1: number, output2: number): number {
    if (value1 === value2) return output1;
    const ratio = (value - value1) / (value2 - value1);
    return output1 + ratio * (output2 - output1);
  }

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
  static interpolateColor(value: number, value1: number, value2: number, color1: string | number[], color2: string | number[]): string {
    /**
     * Parse a color input to [r, g, b, a] format where RGB are 0-255 and alpha is 0-1
     * @param {string | number[]} color - Color as hex string, rgba string, or [r,g,b,a] array (a is 0-255)
     * @returns {[number, number, number, number]} Color as [r, g, b, alpha] where alpha is 0-1
     */
    const parseColor = (color: string | number[]): [number, number, number, number] => {
      if (Array.isArray(color)) {
        if (color.length < 3) {
          logger.logWarning('Invalid color array length, expected at least 3 values [r,g,b]:', color);
          return [255, 0, 0, 1];
        }

        // Safely get values that may be less then 0 or greater than 255
        const r = Math.max(0, Math.min(255, color[0]));
        const g = Math.max(0, Math.min(255, color[1]));
        const b = Math.max(0, Math.min(255, color[2]));

        // Alpha is optional, defaults to 255 (fully opaque), convert to 0-1 range
        const a = color.length > 3 ? Math.max(0, Math.min(255, color[3])) / 255 : 1;

        return [r, g, b, a];
      }

      if (color.startsWith('#')) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
        return [r, g, b, a];
      }
      if (color.startsWith('rgba')) {
        const matches = color.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(1|0|0?\.\d+|1\.0+))?\s*\)$/);
        if (matches) {
          return [parseInt(matches[1], 10), parseInt(matches[2], 10), parseInt(matches[3], 10), parseFloat(matches[4] || '1')];
        }
      }
      // Default to white if parsing fails
      return [255, 255, 255, 1];
    };

    const [r1, g1, b1, a1] = parseColor(color1);
    const [r2, g2, b2, a2] = parseColor(color2);

    const r = Math.round(this.interpolateValue(value, value1, value2, r1, r2));
    const g = Math.round(this.interpolateValue(value, value1, value2, g1, g2));
    const b = Math.round(this.interpolateValue(value, value1, value2, b1, b2));
    const a = this.interpolateValue(value, value1, value2, a1, a2);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Evaluate a simple value expression using feature data.
   * Supports basic arithmetic operations and field references.
   *
   * @param {string} expression - Expression string (e.g., "$feature[\"FIELD_NAME\"] + 90")
   * @param {Feature} feature - Feature containing field data
   * @returns {number | null} The evaluated result or null if evaluation fails
   * @static
   */
  static evaluateValueExpression(expression: string, feature: Feature): number | null {
    try {
      // Replace $feature["fieldName"] or $feature['fieldName'] with actual values
      const evaluableExpression = expression.replace(/\$feature\[["']([^"']+)["']\]/g, (match, fieldName) => {
        const value = feature.get(fieldName);
        if (value === undefined || value === null) {
          return 'null';
        }
        const numericValue = Number(value);
        if (Number.isNaN(numericValue)) {
          return value;
        }
        return String(numericValue);
      });

      // Safety check: only allow numbers, operators, and whitespace
      if (!/^[\d+\-*/().%^ \t\r\n]+$/i.test(evaluableExpression)) {
        logger.logWarning('Invalid characters in expression:', expression);
        return null;
      }

      // Evaluate the expression using Function constructor (safer than eval)
      const result = new Function(`return ${evaluableExpression}`)();

      return typeof result === 'number' && !Number.isNaN(result) ? result : null;
    } catch (error) {
      logger.logWarning('Failed to evaluate expression:', expression, error);
      return null;
    }
  }

  /**
   * Apply visual variables to a style based on feature data.
   *
   * @param {Style} style - The base style to modify.
   * @param {Feature} feature - Feature containing the data values.
   * @param {TypeLayerStyleVisualVariable[]} visualVariables - Visual variable configurations.
   * @param {TypeAliasLookup?} aliasLookup - Optional lookup table for field name aliases.
   * @returns {Style} The modified style with visual variables applied.
   * @static @private
   */
  static #applyVisualVariables(style: Style, feature: Feature, visualVariables: TypeLayerStyleVisualVariable[]): Style {
    if (!visualVariables || visualVariables.length === 0) return style;

    const modifiedStyle = style.clone();

    visualVariables.forEach((visualVar) => {
      let dataValue: number;

      if (visualVar.valueExpression) {
        // Evaluate the expression
        const expressionResult = this.evaluateValueExpression(visualVar.valueExpression, feature);
        if (expressionResult === null) return; // Skip if expression evaluation failed
        dataValue = expressionResult;
      } else if (visualVar.field) {
        // Get the field value from the feature
        const rawValue = feature.get(visualVar.field);
        if (rawValue === undefined || rawValue === null) return;

        dataValue = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));
        if (Number.isNaN(dataValue)) return;

        // Handle normalization field if specified
        if (visualVar.normalizationField) {
          const normValue = feature.get(visualVar.normalizationField);
          const normNumber = typeof normValue === 'number' ? normValue : parseFloat(String(normValue));
          if (!Number.isNaN(normNumber) && normNumber !== 0) {
            dataValue /= normNumber;
          }
        }
      } else {
        // Neither expression or field specified
        return;
      }

      // Apply based on visual variable type
      switch (visualVar.type) {
        case 'colorInfo':
          this.#applyColorVisualVariable(modifiedStyle, dataValue, visualVar);
          break;
        case 'sizeInfo':
          this.#applySizeVisualVariable(modifiedStyle, dataValue, visualVar);
          break;
        case 'rotationInfo':
          this.#applyRotationVisualVariable(modifiedStyle, dataValue, visualVar);
          break;
        case 'opacityInfo':
          this.#applyOpacityVisualVariable(modifiedStyle, dataValue, visualVar);
          break;
        default:
          break;
      }
    });

    return modifiedStyle;
  }

  /**
   * Apply color visual variable to a style.
   *
   * @param {Style} style - The style to modify.
   * @param {number} dataValue - The data value from the feature.
   * @param {TypeLayerStyleVisualVariable} visualVar - The visual variable configuration.
   * @static @private
   */
  static #applyColorVisualVariable(style: Style, dataValue: number, visualVar: TypeLayerStyleVisualVariable): void {
    if (!visualVar.stops || visualVar.stops.length < 2) return;

    // Find the two stops that bracket the data value
    const sortedStops = [...visualVar.stops].sort((a, b) => Number(a.value) - Number(b.value));

    let color: string | undefined;

    // Check if value is below the first stop
    if (dataValue <= Number(sortedStops[0].value)) {
      const { color: stopColor } = sortedStops[0];
      color = stopColor;
    }
    // Check if value is above the last stop
    else if (dataValue >= Number(sortedStops[sortedStops.length - 1].value)) {
      const { color: stopColor } = sortedStops[sortedStops.length - 1];
      color = stopColor;
    }
    // Interpolate between stops
    else {
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const stop1 = sortedStops[i];
        const stop2 = sortedStops[i + 1];
        if (dataValue >= Number(stop1.value) && dataValue <= Number(stop2.value)) {
          if (stop1.color && stop2.color) {
            color = this.interpolateColor(dataValue, Number(stop1.value), Number(stop2.value), stop1.color, stop2.color);
          }
          break;
        }
      }
    }

    if (!color) return;

    const image = style.getImage();
    if (image instanceof Circle || image instanceof RegularShape) {
      const fill = image.getFill();
      fill?.setColor(color);
    }

    // Apply color to appropriate style component
    const fill = style.getFill();
    const stroke = style.getStroke();

    if (fill) {
      fill.setColor(color);
    }
    // Optionally update stroke color as well
    if (stroke) {
      stroke.setColor(color);
    }
  }

  /**
   * Apply size visual variable to a style.
   *
   * @param {Style} style - The style to modify.
   * @param {number} dataValue - The data value from the feature.
   * @param {TypeLayerStyleVisualVariable} visualVar - The visual variable configuration.
   * @static @private
   */
  static #applySizeVisualVariable(style: Style, dataValue: number, visualVar: TypeLayerStyleVisualVariable): void {
    let size: number | undefined;

    // Method 1: Using min/max data values and sizes
    if (
      visualVar.minDataValue !== undefined &&
      visualVar.maxDataValue !== undefined &&
      visualVar.minSize !== undefined &&
      visualVar.maxSize !== undefined
    ) {
      size = this.interpolateValue(dataValue, visualVar.minDataValue, visualVar.maxDataValue, visualVar.minSize, visualVar.maxSize);
    }
    // Method 2: Using stops
    else if (visualVar.stops && visualVar.stops.length >= 2) {
      const sortedStops = [...visualVar.stops].sort((a, b) => Number(a.value) - Number(b.value));

      // Check if value is below the first stop
      if (dataValue <= Number(sortedStops[0].value)) {
        const { size: stopSize } = sortedStops[0];
        size = stopSize;
      }
      // Check if value is above the last stop
      else if (dataValue >= Number(sortedStops[sortedStops.length - 1].value)) {
        const { size: stopSize } = sortedStops[sortedStops.length - 1];
        size = stopSize;
      }
      // Interpolate between stops
      else {
        for (let i = 0; i < sortedStops.length - 1; i++) {
          const stop1 = sortedStops[i];
          const stop2 = sortedStops[i + 1];
          if (dataValue >= Number(stop1.value) && dataValue <= Number(stop2.value)) {
            if (stop1.size !== undefined && stop2.size !== undefined) {
              size = this.interpolateValue(dataValue, Number(stop1.value), Number(stop2.value), stop1.size, stop2.size);
            }
            break;
          }
        }
      }
    }

    if (size === undefined) return;

    // Apply size to appropriate style component
    const image = style.getImage();
    if (image instanceof Circle) {
      image.setRadius(size);
    }

    if (image instanceof RegularShape) {
      const prevRadius = image.getRadius();
      image.setScale(size / prevRadius);
    }

    // For line strings
    const stroke = style.getStroke();
    if (stroke && !image) {
      stroke.setWidth(size);
    }
  }

  /**
   * Apply rotation visual variable to a style.
   *
   * @param {Style} style - The style to modify.
   * @param {number} dataValue - The data value from the feature.
   * @param {TypeLayerStyleVisualVariable} visualVar - The visual variable configuration.
   * @static @private
   */
  static #applyRotationVisualVariable(style: Style, dataValue: number, visualVar: TypeLayerStyleVisualVariable): void {
    const image = style.getImage();
    if (!image) return;

    // Convert rotation based on type
    let rotationRadians = dataValue;

    if (visualVar.rotationType === 'geographic') {
      // Geographic rotation: 0 degrees = North, clockwise
      // Convert to mathematical rotation (counter-clockwise from East)
      rotationRadians = ((90 - dataValue) * Math.PI) / 180;
    } else {
      // Arithmetic rotation: 0 degrees = East, counter-clockwise (default)
      rotationRadians = (dataValue * Math.PI) / 180;
    }

    // Apply rotation
    if (image.setRotation) {
      image.setRotation(rotationRadians);
    }
  }

  /**
   * Apply opacity visual variable to a style.
   *
   * @param {Style} style - The style to modify.
   * @param {number} dataValue - The data value from the feature.
   * @param {TypeLayerStyleVisualVariable} visualVar - The visual variable configuration.
   * @static @private
   */
  static #applyOpacityVisualVariable(style: Style, dataValue: number, visualVar: TypeLayerStyleVisualVariable): void {
    if (!visualVar.stops || visualVar.stops.length < 2) return;

    const sortedStops = [...visualVar.stops].sort((a, b) => Number(a.value) - Number(b.value));

    let opacity: number | undefined;

    // Check if value is below the first stop
    if (dataValue <= Number(sortedStops[0].value)) {
      const { opacity: stopOpacity } = sortedStops[0];
      opacity = stopOpacity;
    }
    // Check if value is above the last stop
    else if (dataValue >= Number(sortedStops[sortedStops.length - 1].value)) {
      const { opacity: stopOpacity } = sortedStops[sortedStops.length - 1];
      opacity = stopOpacity;
    }
    // Interpolate between stops
    else {
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const stop1 = sortedStops[i];
        const stop2 = sortedStops[i + 1];
        if (dataValue >= Number(stop1.value) && dataValue <= Number(stop2.value)) {
          if (stop1.opacity !== undefined && stop2.opacity !== undefined) {
            opacity = this.interpolateValue(dataValue, Number(stop1.value), Number(stop2.value), stop1.opacity, stop2.opacity);
          }
          break;
        }
      }
    }

    if (opacity === undefined) return;

    // Clamp opacity to [0, 1]
    opacity = Math.max(0, Math.min(1, opacity));

    // Apply opacity to all style components
    const image = style.getImage();
    if (image && image.setOpacity) {
      image.setOpacity(opacity);
      style.setImage(image);
    }

    if (image instanceof Circle || image instanceof RegularShape) {
      const imgFill = image.getFill();
      if (imgFill) {
        const color = imgFill?.getColor();
        if (typeof color === 'string') {
          // Parse and modify alpha channel
          const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
          if (rgba) {
            imgFill.setColor(`rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${opacity})`);
          }
        }
      }
    }

    const fill = style.getFill();
    if (fill) {
      const color = fill.getColor();
      if (typeof color === 'string') {
        // Parse and modify alpha channel
        const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
        if (rgba) {
          fill.setColor(`rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${opacity})`);
        }
      }
    }

    const stroke = style.getStroke();
    if (stroke) {
      const color = stroke.getColor();
      if (typeof color === 'string') {
        const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
        if (rgba) {
          stroke.setColor(`rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${opacity})`);
        }
      }
    }
  }

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
  static searchUniqueValueEntry(
    fields: string[],
    uniqueValueStyleInfo: TypeLayerStyleConfigInfo[],
    feature?: Feature,
    domainsLookup?: TypeLayerMetadataFields[],
    aliasLookup?: TypeAliasLookup
  ): TypeLayerStyleConfigInfo | undefined {
    // If no feature
    if (!feature) return undefined;

    // Get the feature keys
    const featureKeys = feature.getKeys();

    // Start looping on the unique value style to find
    for (let i = 0; i < uniqueValueStyleInfo.length; i++) {
      // Start looping on the fields
      let allFieldsMatched = true;
      for (let j = 0; j < fields.length; j++) {
        const field = fields[j];
        const expectedValue = uniqueValueStyleInfo[i].values[j];

        // Get the target field name: check case-insensitive match in feature keys
        let fieldName = featureKeys.find((key) => key.toLowerCase() === field.toLowerCase());

        // Try alias if no match found, then re-validate the alias key against feature keys
        if (!fieldName && aliasLookup?.[field]) {
          const alias = aliasLookup[field];
          fieldName = featureKeys.find((key) => key.toLowerCase() === alias.toLowerCase());
        }

        if (!fieldName) {
          logger.logWarning(`Renderer searchUniqueValueEntry: Cannot find field "${field}"`);
          return undefined;
        }

        // Read the actual value
        let actualValue = feature.get(fieldName);

        // First try direct match
        // eslint-disable-next-line eqeqeq
        let matched = actualValue == expectedValue;

        // If not matched, check coded domain
        if (!matched) {
          const fieldDomain = domainsLookup?.find((domain) => domain.name === fieldName)?.domain;
          // Cast as codedvaluetype
          const fieldDomainCasted = fieldDomain as codedValueType;
          if (fieldDomainCasted?.codedValues) {
            const codedValue = fieldDomainCasted.codedValues.find((dom) => dom.name === actualValue);
            if (codedValue) {
              actualValue = codedValue.code;
              // eslint-disable-next-line eqeqeq
              matched = actualValue == expectedValue;
            }
          }
        }

        // If this field did not match, mark the whole thing as a mismatch
        if (!matched) {
          allFieldsMatched = false;
          break;
        }
      }

      if (allFieldsMatched) {
        return uniqueValueStyleInfo[i];
      }
    }

    return undefined;
  }

  /**
   * Process the unique value settings using a point feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
   * @param {Feature?} feature - Feature used to test the unique value conditions.
   * @param {TypeStyleProcessorOptions?} options - Optional processing options.
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processUniqueValuePoint(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, legendFilterIsOff, domainsLookup, aliasLookup, visualVariables } = options || {};

    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;

    if (styleSettings.type === 'uniqueValue') {
      const { hasDefault, fields, info } = styleSettings;
      const styleEntry = this.searchUniqueValueEntry(fields, info, feature, domainsLookup, aliasLookup);

      if (styleEntry !== undefined && (legendFilterIsOff || styleEntry.visible !== false))
        return this.processSimplePoint(styleEntry.settings, feature, { visualVariables });

      // When using hasDefault, the last position is determinant in figuring out the style of an unprocessed feature
      // TODO: This should be changed, because some services will not have the 'others' in their last position
      if (
        styleEntry === undefined &&
        hasDefault &&
        (legendFilterIsOff || styleSettings.info[styleSettings.info.length - 1].visible !== false)
      )
        return this.processSimplePoint(styleSettings.info[styleSettings.info.length - 1].settings, feature, { visualVariables });
    }
    return undefined;
  }

  /**
   * Process the unique value settings using a lineString feature to get its Style.
   *
   * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
   * @param {Feature?} feature - Feature used to test the unique value conditions.
   * @param {TypeStyleProcessorOptions?} options - Optional processing options.
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processUniqueLineString(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, legendFilterIsOff, domainsLookup, aliasLookup, visualVariables } = options || {};

    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;

    if (styleSettings.type === 'uniqueValue') {
      const { hasDefault, fields, info } = styleSettings;
      const styleEntry = this.searchUniqueValueEntry(fields, info, feature, domainsLookup, aliasLookup);

      if (styleEntry !== undefined && (legendFilterIsOff || styleEntry.visible !== false))
        return this.processSimpleLineString(styleEntry.settings, feature, { visualVariables });

      // When using hasDefault, the last position is determinant in figuring out the style of an unprocessed feature
      // TODO: This should be changed, because some services will not have the 'others' in their last position
      if (styleEntry === undefined && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false))
        return this.processSimpleLineString(info[info.length - 1].settings, feature, { visualVariables });
    }
    return undefined;
  }

  /**
   * Process the unique value settings using a polygon feature to get its Style.
   *
   * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
   * @param {Feature?} feature - Feature used to test the unique value conditions.
   * @param {TypeStyleProcessorOptions?} options - Optional processing options.
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processUniquePolygon(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, legendFilterIsOff, domainsLookup, aliasLookup, visualVariables } = options || {};

    if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;

    if (styleSettings.type === 'uniqueValue') {
      const { hasDefault, fields, info } = styleSettings;
      const styleEntry = this.searchUniqueValueEntry(fields, info, feature, domainsLookup, aliasLookup);
      if (styleEntry !== undefined && (legendFilterIsOff || styleEntry.visible !== false))
        return this.processSimplePolygon(styleEntry.settings, feature, { visualVariables });

      // When using hasDefault, the last position is determinant in figuring out the style of an unprocessed feature
      // TODO: This should be changed, because some services will not have the 'others' in their last position
      if (styleEntry === undefined && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false))
        return this.processSimplePolygon(info[info.length - 1].settings, feature, { visualVariables });
    }
    return undefined;
  }

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
  static searchClassBreakEntry(
    field: string,
    classBreakStyleInfo: TypeLayerStyleConfigInfo[],
    feature: Feature,
    aliasLookup?: TypeAliasLookup
  ): TypeLayerStyleConfigInfo | undefined {
    // For obscure reasons, it seems that sometimes the field names in the feature do not have the same case as those in the
    // class break definition.
    const featureKey = feature.getKeys().filter((key) => {
      return key.toLowerCase() === field.toLowerCase();
    });

    // Failed to find match: Attempt to find the alias key from the names
    if (featureKey.length !== 1 && aliasLookup && Object.keys(aliasLookup).length > 0) {
      if (field in Object.keys(aliasLookup)) {
        featureKey.push(aliasLookup[field]);
      }
    }

    if (featureKey.length !== 1) return undefined;

    const fieldValueRaw = feature.get(featureKey[0]);

    // Try to read it as a number, because we're in class break rendering mode, don't trust the service to sometimes return a string value like '1234' here..
    const fieldValue = Number(fieldValueRaw);

    // For each bucket
    for (let i = 0; i < classBreakStyleInfo.length; i++) {
      const minBreak = Number(classBreakStyleInfo[i].values[0]);
      const maxBreak = Number(classBreakStyleInfo[i].values[1]);
      let conditions = classBreakStyleInfo[i].valuesConditions;

      // If no conditions simulate an Esri behavior supporting legacy mode - i.e: the first bucket is min <= value <= max and the other buckets are min < value <= max (note the <= vs <)
      if (!conditions) {
        // If this is the first break, use ['gte', 'lte']
        if (i === 0) conditions = ['>=', '<='];
        // If this is the other breaks, use ['gt', 'lte']
        if (!conditions && i > 0) conditions = ['>', '<='];
      } // Now, conditions is set

      // Check the value vs the bounds and the conditions
      if (this.searchClassBreakEntryCheck(fieldValue, minBreak, maxBreak, conditions!)) {
        return classBreakStyleInfo[i];
      }
      // Continue searching the break class index
    }

    // Not found
    return undefined;
  }

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
  static searchClassBreakEntryCheck(value: number, min: number, max: number, conditions: TypeLayerStyleValueCondition[]): boolean {
    // Depending on the conditions for minimum and maximum
    if (conditions[0] === '>' && conditions[1] === '<') {
      return min < value && value < max;
    } else if (conditions[0] === '>' && conditions[1] === '<=') {
      return min < value && value <= max;
    } else if (conditions[0] === '>=' && conditions[1] === '<') {
      return min <= value && value < max;
    } else if (conditions[0] === '>=' && conditions[1] === '<=') {
      return min <= value && value <= max;
    }

    // Unsupported
    throw new NotSupportedError('Unsupported conditions to compare the values for the class break renderer');
  }

  /**
   * Process the class break settings using a Point feature to get its Style.
   *
   * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
   * @param {Feature} feature - Feature used to test the unique value conditions.
   * @param {TypeStyleProcessorOptions?} options - Optional processing options.
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processClassBreaksPoint(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, legendFilterIsOff, aliasLookup, visualVariables } = options || {};

    if (filterEquation !== undefined && filterEquation.length !== 0 && feature) {
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;
    }

    if (styleSettings.type === 'classBreaks') {
      const { hasDefault, fields, info } = styleSettings;
      const foundClassBreakInfo = this.searchClassBreakEntry(fields[0], info, feature!, aliasLookup);

      // If found a class break renderer that works for the value of the feature
      if (foundClassBreakInfo && (legendFilterIsOff || foundClassBreakInfo.visible !== false)) {
        return this.processSimplePoint(foundClassBreakInfo.settings, feature, { visualVariables });
      }

      // When using hasDefault, the last position is determinant in figuring out the style of an unprocessed feature
      // TODO: This should be changed, because some services will not have the 'others' in their last position
      if (!foundClassBreakInfo && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false)) {
        return this.processSimplePoint(info[info.length - 1].settings, feature, { visualVariables });
      }
    }
    return undefined;
  }

  /**
   * Process the class break settings using a lineString feature to get its Style.
   *
   * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
   * @param {Feature} feature - Feature used to test the unique value conditions.
   * @param {TypeStyleProcessorOptions?} options - Optional processing options.
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processClassBreaksLineString(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, legendFilterIsOff, aliasLookup, visualVariables } = options || {};
    if (filterEquation !== undefined && filterEquation.length !== 0 && feature) {
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;
    }

    if (styleSettings.type === 'classBreaks') {
      const { hasDefault, fields, info } = styleSettings;
      const foundClassBreakInfo = this.searchClassBreakEntry(fields[0], info, feature!, aliasLookup);

      // If found a class break renderer that works for the value of the feature
      if (foundClassBreakInfo && (legendFilterIsOff || foundClassBreakInfo.visible !== false)) {
        return this.processSimpleLineString(foundClassBreakInfo.settings, feature, { visualVariables });
      }

      // When using hasDefault, the last position is determinant in figuring out the style of an unprocessed feature
      // TODO: This should be changed, because some services will not have the 'others' in their last position
      if (!foundClassBreakInfo && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false)) {
        return this.processSimpleLineString(info[info.length - 1].settings, feature, { visualVariables });
      }
    }
    return undefined;
  }

  /**
   * Process the class break settings using a Polygon feature to get its Style.
   *
   * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
   * @param {Feature} feature - Feature used to test the unique value conditions.
   * @param {TypeStyleProcessorOptions?} options - Optional processing options.
   * @returns {Style | undefined} The Style created. Undefined if unable to create it.
   * @static
   */
  static processClassBreaksPolygon(
    styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
    feature?: Feature,
    options?: TypeStyleProcessorOptions
  ): Style | undefined {
    const { filterEquation, legendFilterIsOff, aliasLookup, visualVariables } = options || {};

    if (filterEquation !== undefined && filterEquation.length !== 0 && feature) {
      if (this.featureIsNotVisible(feature, filterEquation)) return undefined;
    }

    if (styleSettings.type === 'classBreaks') {
      const { hasDefault, fields, info } = styleSettings;
      const foundClassBreakInfo = this.searchClassBreakEntry(fields[0], info, feature!, aliasLookup);

      // If found a class break renderer that works for the value of the feature
      if (foundClassBreakInfo && (legendFilterIsOff || foundClassBreakInfo.visible !== false)) {
        return this.processSimplePolygon(foundClassBreakInfo.settings, feature, { visualVariables });
      }

      // When using hasDefault, the last position is determinant in figuring out the style of an unprocessed feature
      // TODO: This should be changed, because some services will not have the 'others' in their last position
      if (!foundClassBreakInfo && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false)) {
        return this.processSimplePolygon(info[info.length - 1].settings, feature, { visualVariables });
      }
    }
    return undefined;
  }

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
  static getAndCreateFeatureStyle(
    feature: FeatureLike,
    resolution: number,
    style: TypeLayerStyleConfig,
    label: string,
    filterEquation?: FilterNodeType[],
    legendFilterIsOff?: boolean,
    aliasLookup?: TypeAliasLookup,
    layerText?: TypeLayerTextConfig,
    callbackWhenCreatingStyle?: (geometryType: TypeStyleGeometry, style: TypeLayerStyleConfigInfo) => void
  ): Style | undefined {
    // Get the geometry type
    const geometryType = this.getGeometryType(feature);

    // The style to work on
    let styleWorkOn = style;

    // If style does not exist for the geometryType, create it.
    if (!style || !style[geometryType]) {
      // Create a style on-the-fly for the geometry type, because the layer config didn't have one already
      const styleConfig = this.createDefaultStyle(geometryType, label);

      // If a style has been created on-the-fly
      if (styleConfig) {
        if (style) styleWorkOn[geometryType] = styleConfig;
        else styleWorkOn = { [geometryType]: styleConfig };
        callbackWhenCreatingStyle?.(geometryType, styleConfig.info[0]);
      }
    }

    // Get the style according to its type and geometry.
    if (styleWorkOn[geometryType]) {
      const styleSettings = style[geometryType]!;
      const { type, visualVariables } = styleSettings;
      const options: TypeStyleProcessorOptions = {
        filterEquation,
        legendFilterIsOff,
        aliasLookup,
        visualVariables,
      };

      // TODO: Refactor - Rewrite this to use explicit function calls instead, for clarity and references finding
      const featureStyle = this.processStyle[type][geometryType](styleSettings, feature as Feature, options);

      const textStyle = GeoviewRenderer.getTextStyle(feature, resolution, styleSettings, layerText, aliasLookup);
      if (textStyle && featureStyle) {
        featureStyle.setText(textStyle);
      }

      return featureStyle;
    }

    return undefined;
  }

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
  static getFeatureImageSource(
    feature: Feature,
    style: TypeLayerStyleConfig,
    filterEquation?: FilterNodeType[],
    legendFilterIsOff?: boolean,
    domainsLookup?: TypeLayerMetadataFields[],
    aliasLookup?: TypeAliasLookup
  ): string | undefined {
    // The image source that will be returned (if calculated successfully)
    let imageSource: string | undefined;

    // GV: Sometimes, the feature will have no geometry e.g. esriDynamic as we fetch geometry only when needed
    // GV: We need to extract geometry from style instead. For esriDynamic there is only one geometry at a time
    // If the feature has a geometry or Style has a geometry
    if (feature.getGeometry() || Object.keys(style)[0]) {
      const geometryType = feature.getGeometry() ? this.getGeometryType(feature) : (Object.keys(style)[0] as TypeStyleGeometry);

      // Get the style accordingly to its type and geometry.
      if (style[geometryType]) {
        const styleSettings = style[geometryType];
        const { type, visualVariables } = styleSettings;

        // TODO: Performance #2688 - Wrap the style processing in a Promise to prevent blocking, Use requestAnimationFrame to process style during next frame
        // Wrap the style processing in a Promise to prevent blocking
        // return new Promise((resolve) => {
        //   // Use requestAnimationFrame to process style during next frame
        //   requestAnimationFrame(() => {
        //     const processedStyle = processStyle[type][geometryType](
        //       styleSettings,
        //       feature as Feature,
        //       filterEquation,
        //       legendFilterIsOff
        //     );
        //     resolve(processedStyle);
        //   });
        // });
        const options: TypeStyleProcessorOptions = {
          filterEquation,
          legendFilterIsOff,
          domainsLookup,
          aliasLookup,
          visualVariables,
        };

        const featureStyle = this.processStyle[type][geometryType](styleSettings, feature, options);

        if (featureStyle) {
          if (geometryType === 'Point') {
            if (
              (styleSettings.type === 'simple' && !(featureStyle.getImage() instanceof Icon)) ||
              (styleSettings.type === 'uniqueValue' && !(featureStyle.getImage() instanceof Icon)) ||
              (styleSettings.type === 'classBreaks' && !(featureStyle.getImage() instanceof Icon))
            ) {
              imageSource = this.createPointCanvas(featureStyle).toDataURL();
            } else {
              imageSource = (featureStyle.getImage() as Icon).getSrc() || undefined;
            }
          } else if (geometryType === 'LineString') {
            imageSource = this.createLineStringCanvas(featureStyle).toDataURL();
          } else {
            imageSource = this.createPolygonCanvas(featureStyle).toDataURL();
          }
        }
      }
    }

    // If set, all good
    if (imageSource) return imageSource;

    return undefined;
  }

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
  static classifyUnprocessedNodes(keywordArray: FilterNodeType[]): FilterNodeType[] {
    return keywordArray.map((node, i) => {
      if (node.nodeType === NodeType.unprocessedNode) {
        if (Number.isNaN(Number((node.nodeValue as string).slice(0, 1)))) {
          if (['+', '-'].includes(node.nodeValue as string))
            if (i !== 0 && [NodeType.number, NodeType.string, NodeType.variable].includes(keywordArray[i - 1].nodeType))
              // eslint-disable-next-line no-param-reassign
              node.nodeType = NodeType.binary;
            else {
              // eslint-disable-next-line no-param-reassign
              node.nodeType = NodeType.unary;
              // eslint-disable-next-line no-param-reassign
              node.nodeValue = `u${node.nodeValue}`;
            }
          else if (typeof node.nodeValue === 'string' && node.nodeValue.toLowerCase() === 'null') {
            // eslint-disable-next-line no-param-reassign
            node.nodeType = NodeType.variable;
            // eslint-disable-next-line no-param-reassign
            node.nodeValue = null;
          } else {
            // eslint-disable-next-line no-param-reassign
            node.nodeType = NodeType.variable;
          }
          return node;
        }
        // eslint-disable-next-line no-param-reassign
        node.nodeType = NodeType.number;
        // eslint-disable-next-line no-param-reassign
        node.nodeValue = Number(node.nodeValue);
        if (Number.isNaN(node.nodeValue)) throw new Error(`${node.nodeValue} is an invalid number`);
        return node;
      }
      return node;
    });
  }

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
  static extractKeyword(filterNodeArray: FilterNodeType[], keyword: string, regExp?: RegExp): FilterNodeType[] {
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
        // eslint-disable-next-line no-param-reassign
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
            }, [] as FilterNodeType[])
            .slice(0, -1)
        );
      }
      return newKeywordArray;
    }, [] as FilterNodeType[]);
  }

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
  static extractStrings(keywordArray: FilterNodeType[]): FilterNodeType[] {
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
    }, [] as FilterNodeType[]);
    if (stringHasBegun)
      if (!stringNeeded && contiguousApostrophes === 1) keywordArrayToReturn.push({ nodeType: NodeType.string, nodeValue: stringValue });
      else throw new Error(`string not closed`);
    return keywordArrayToReturn;
  }

  /**
   * Analyse the filter and split it in syntaxique nodes.  If a problem is detected, an error object is thrown with an
   * explanatory message.
   *
   * @param {FilterNodeType[]} filterNodeArrayType - Node array to analyse.
   *
   * @returns {FilterNodeType[]} The new node array with all nodes classified.
   * @static
   */
  static analyzeLayerFilter(filterNodeArrayType: FilterNodeType[]): FilterNodeType[] {
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

  /** Table used to define line symbology to use when drawing lineString and polygon perimeters */
  static lineDashSettings: Record<TypeLineStyle, number[] | undefined> = {
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

  /** Table used to define line symbology to use when drawing polygon fill */
  static FillPatternSettings: FillPatternSettings = {
    null: [],
    dot: [],
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

  /** Table of function to process simpleSymbol settings. */
  static #processSymbol: Record<TypeSymbol, (settings: TypeSimpleSymbolVectorConfig) => Style | undefined> = {
    circle: GeoviewRenderer.processCircleSymbol.bind(GeoviewRenderer),
    '+': GeoviewRenderer.processPlusSymbol.bind(GeoviewRenderer),
    diamond: GeoviewRenderer.processDiamondSymbol.bind(GeoviewRenderer),
    square: GeoviewRenderer.processSquareSymbol.bind(GeoviewRenderer),
    triangle: GeoviewRenderer.processTriangleSymbol.bind(GeoviewRenderer),
    X: GeoviewRenderer.processXSymbol.bind(GeoviewRenderer),
    star: GeoviewRenderer.processStarSymbol.bind(GeoviewRenderer),
  };

  /** Table of function to process polygon fill style settings. */
  static #processFillStyle: Record<TypeFillStyle, (settings: TypePolygonVectorConfig, geometry?: Geometry) => Style | undefined> = {
    null: GeoviewRenderer.processNullFill.bind(GeoviewRenderer),
    solid: GeoviewRenderer.processSolidFill.bind(GeoviewRenderer),
    backwardDiagonal: GeoviewRenderer.processBackwardDiagonalFill.bind(GeoviewRenderer),
    cross: GeoviewRenderer.processCrossFill.bind(GeoviewRenderer),
    diagonalCross: GeoviewRenderer.processDiagonalCrossFill.bind(GeoviewRenderer),
    forwardDiagonal: GeoviewRenderer.processForwardDiagonalFill.bind(GeoviewRenderer),
    horizontal: GeoviewRenderer.processHorizontalFill.bind(GeoviewRenderer),
    vertical: GeoviewRenderer.processVerticalFill.bind(GeoviewRenderer),
    dot: GeoviewRenderer.processDotFill.bind(GeoviewRenderer),
  };

  /** Table of function to process the style settings based on the feature geometry and the kind of style settings. */
  static processStyle: Record<TypeLayerStyleConfigType, Record<TypeStyleGeometry, TypeStyleProcessor>> = {
    simple: {
      Point: GeoviewRenderer.processSimplePoint.bind(GeoviewRenderer),
      MultiPoint: GeoviewRenderer.processSimplePoint.bind(GeoviewRenderer),
      LineString: GeoviewRenderer.processSimpleLineString.bind(GeoviewRenderer),
      MultiLineString: GeoviewRenderer.processSimpleLineString.bind(GeoviewRenderer),
      Polygon: GeoviewRenderer.processSimplePolygon.bind(GeoviewRenderer),
      MultiPolygon: GeoviewRenderer.processSimplePolygon.bind(GeoviewRenderer),
    },
    uniqueValue: {
      Point: GeoviewRenderer.processUniqueValuePoint.bind(GeoviewRenderer),
      MultiPoint: GeoviewRenderer.processUniqueValuePoint.bind(GeoviewRenderer),
      LineString: GeoviewRenderer.processUniqueLineString.bind(GeoviewRenderer),
      MultiLineString: GeoviewRenderer.processUniqueLineString.bind(GeoviewRenderer),
      Polygon: GeoviewRenderer.processUniquePolygon.bind(GeoviewRenderer),
      MultiPolygon: GeoviewRenderer.processUniquePolygon.bind(GeoviewRenderer),
    },
    classBreaks: {
      Point: GeoviewRenderer.processClassBreaksPoint.bind(GeoviewRenderer),
      MultiPoint: GeoviewRenderer.processClassBreaksPoint.bind(GeoviewRenderer),
      LineString: GeoviewRenderer.processClassBreaksLineString.bind(GeoviewRenderer),
      MultiLineString: GeoviewRenderer.processClassBreaksLineString.bind(GeoviewRenderer),
      Polygon: GeoviewRenderer.processClassBreaksPolygon.bind(GeoviewRenderer),
      MultiPolygon: GeoviewRenderer.processClassBreaksPolygon.bind(GeoviewRenderer),
    },
  };

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
  static getTextStyle = (
    feature: FeatureLike,
    resolution: number,
    styleSettings: TypeLayerStyleSettings,
    layerText?: TypeLayerTextConfig,
    aliasLookup?: TypeAliasLookup
  ): Text | undefined => {
    const { type, info } = styleSettings;
    let symbolText: TypeLayerTextConfig | undefined;

    if (type === 'simple') {
      // For simple styles, use the first (and only) style info
      symbolText = info[0]?.text;
    }

    if (type === 'uniqueValue') {
      // Find the matching unique value entry
      const foundUniqueValueInfo = this.searchUniqueValueEntry(
        styleSettings.fields,
        info,
        feature as Feature,
        undefined, // domainsLookup
        aliasLookup
      );
      symbolText = foundUniqueValueInfo?.text;
    }

    if (type === 'classBreaks') {
      // Find the matching class break entry
      const foundClassBreakInfo = this.searchClassBreakEntry(styleSettings.fields[0], info, feature as Feature, aliasLookup);
      symbolText = foundClassBreakInfo?.text;
    }

    const textSettings = symbolText || layerText;
    if (!textSettings) return undefined;
    if (textSettings.minZoomLevel !== undefined && resolution > GeoviewRenderer.getApproximateResolution(textSettings.minZoomLevel))
      return undefined;
    if (textSettings.maxZoomLevel !== undefined && resolution < GeoviewRenderer.getApproximateResolution(textSettings.maxZoomLevel))
      return undefined;

    return GeoviewRenderer.createTextStyle(feature, textSettings);
  };

  /**
   * Method for creating Text Style
   * @param {FeatureLike} feature - The feature to create the text style for
   * @param {TypeLayerTextConfig} textSettings - The text style settings
   * @returns {Text | undefined} The text style
   * @static
   */
  static createTextStyle = (feature: FeatureLike, textSettings: TypeLayerTextConfig): Text | undefined => {
    const {
      field,
      fontSize = 10,
      fontFamily = 'sans-serif',
      bold = false,
      italic = false,
      maxAngle,
      offsetX,
      offsetY,
      overflow,
      placement,
      repeat,
      scale,
      rotateWithView,
      keepUpright,
      rotation,
      text,
      textAlign,
      justify,
      textBaseline,
      fill,
      haloColor,
      haloWidth,
      backgroundFill,
      backgroundStrokeColor,
      backgroundStrokeWidth,
      padding,
      declutterMode = 'declutter',
      wrap,
      wrapCount = 16,
      wrapLines,
    } = textSettings;

    // Get text from feature field or use static text
    let textValue: string | string[] | undefined;
    if (field) {
      textValue = String(feature.get(field) || undefined);
    } else if (text) {
      if (Array.isArray(text)) {
        // Process rich text array - only process text elements: ['text value', 'bold 10px sans-serif', '\n', '', 'text value 2', 'italic 8px serif']
        textValue = text.map((item, index) => {
          if (index % 2 === 0 && typeof item === 'string') {
            return item.includes('{') ? GeoviewRenderer.processTextTemplate(item, feature) : item;
          }
          return item;
        });
      } else {
        textValue = text.includes('{') ? GeoviewRenderer.processTextTemplate(text, feature) : text;
      }
    }
    if (!textValue) return undefined;

    if (wrap && typeof textValue === 'string') {
      textValue = GeoviewRenderer.wrapText(textValue, wrapCount, wrapLines);
    }

    // Build font string
    let fontStyle = '';
    if (italic) fontStyle += 'italic ';
    if (bold) fontStyle += 'bold ';
    const font = `${fontStyle}${fontSize}px ${fontFamily}`;

    // Convert rotation from degrees to radians
    const rotationRadians = rotation ? (rotation * Math.PI) / 180 : undefined;

    // Convert maxAngle from degrees to radians
    const maxAngleRadians = maxAngle ? (maxAngle * Math.PI) / 180 : undefined;

    return new Text({
      text: textValue,
      font,
      maxAngle: maxAngleRadians,
      offsetX,
      offsetY,
      overflow,
      placement,
      repeat,
      scale,
      rotateWithView,
      keepUpright,
      rotation: rotationRadians,
      textAlign,
      justify,
      textBaseline,
      fill: fill ? new Fill({ color: fill }) : undefined,
      stroke: haloColor ? new Stroke({ color: haloColor, width: haloWidth || 1 }) : undefined,
      backgroundFill: backgroundFill ? new Fill({ color: backgroundFill }) : undefined,
      backgroundStroke: backgroundStrokeColor ? new Stroke({ color: backgroundStrokeColor, width: backgroundStrokeWidth || 1 }) : undefined,
      padding,
      declutterMode,
    });
  };

  /**
   * Get approximate resolution for common zoom levels by projection
   * @param {number} zoom - The zoom level (0-20)
   * @param {TypeValidMapProjectionCodes} projection - The map projection (3857 for Web Mercator, 3978 for Canada Lambert)
   * @returns {number} Approximate resolution for the given zoom and projection
   * @static
   */
  static getApproximateResolution(zoom: number, projection: TypeValidMapProjectionCodes = 3857): number {
    if (projection === 3978) {
      // Lambert Conformal Conic Canada: resolution ≈ 38364.660062653464 / (2^zoom)
      return 38364.660062653464 / Math.pow(2, zoom);
    }
    // Default to Web Mercator: resolution ≈ 156543.03392804097 / (2^zoom)
    return 156543.03392804097 / Math.pow(2, zoom);
  }

  /**
   * Wrap text to fit within specified constraints
   * @param {string} str - The text to wrap
   * @param {number} width - The maximum width per line
   * @param {number} maxLines - Maximum number of lines (optional, overrides width if needed)
   * @returns {string} The wrapped text
   * @static
   */
  static wrapText(str: string, width: number, maxLines?: number): string {
    if (!maxLines) {
      // Original behavior when no maxLines specified
      return GeoviewRenderer.wrapTextByWidth(str, width);
    }

    // Split text into words
    const words = str.split(/\s+/);
    if (words.length === 0) return str;

    // If we can fit everything in maxLines with normal wrapping, do that
    const normalWrap = GeoviewRenderer.wrapTextByWidth(str, width);
    const normalLines = normalWrap.split('\n');

    if (normalLines.length <= maxLines) {
      return normalWrap;
    }

    // Need to fit into fewer lines - calculate optimal width per line
    const totalChars = str.length;
    const targetWidth = Math.ceil(totalChars / maxLines);

    // Build lines with the calculated width
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= targetWidth || currentLine === '') {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;

        // If we've reached maxLines, truncate remaining text
        if (lines.length >= maxLines - 1) {
          // Add ellipsis if there are more words
          const remainingWords = words.slice(words.indexOf(word));
          if (remainingWords.length > 1) {
            currentLine = `${currentLine}...`;
          }
          break;
        }
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines.slice(0, maxLines).join('\n');
  }

  /**
   * Wrap text to a specified width using word boundaries
   * @param {string} str - The text to wrap
   * @param {number} width - The maximum width of each line
   * @returns {string} The wrapped text
   * @static
   */
  static wrapTextByWidth(str: string, width: number): string {
    // No wrapping required
    if (str.length <= width) return str;

    const words = str.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= width) {
        currentLine = testLine;
      } else {
        // If current line has content, push it and start new line
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word longer than width - force break it
          currentLine = word;
        }
      }
    }

    // Add the last line if it has content
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

  /**
   * Process text template by replacing field placeholders with feature values
   * Expects somewhat clean field names, so we shouldn't need to worry about escaping special characters (Dates may still have characters after the colon)
   * @param {string} template - The text template with {field-name} placeholders
   * @param {FeatureLike} feature - The feature to get field values from
   * @returns {string} The processed text with field values substituted
   * @static
   */
  static processTextTemplate(template: string, feature: FeatureLike): string {
    return template.replace(/\{(\w+)(?::([^}]+))?\}/g, (match, fieldName, format) => {
      const fieldValue = feature.get(fieldName.trim());
      if (fieldValue === undefined) return match;

      // If format is specified, try to format as date
      if (format) {
        try {
          return DateMgt.formatDate(fieldValue, format);
        } catch (e) {
          // Fall back to string conversion if date parsing fails
          logger.logWarning(`There was an issue replacing the field, ${fieldName}, with a value:`, e);
        }
      }

      return String(fieldValue);
    });
  }

  /**
   * Builds a filter string (SQL-like or OGC-compliant) for a given layer and style configuration.
   * This method supports:
   * - **simple styles** → returns the base layer filter or a default `(1=1)` condition.
   * - **unique value styles** → builds an optimized filter for visible categories.
   * - **class breaks styles** → builds numeric range filters based on visibility flags.
   * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
   * @param {TypeLayerStyleConfig | undefined} style - The style configuration (optional).
   * @returns {string | undefined} The filter expression, or `undefined` if not applicable.
   */
  static getFilterFromStyle(
    outFields: TypeOutfields[] | undefined,
    style: TypeLayerStyleConfig | undefined,
    styleSettings: TypeLayerStyleSettings | undefined
  ): string | undefined {
    // No style, no filter on style
    if (!style) return undefined;

    // No style settings, default filter
    if (!styleSettings) return undefined;

    switch (styleSettings.type) {
      case 'simple':
        return undefined;

      case 'uniqueValue': {
        // Check if any fields were retrieved
        if (!outFields) {
          // Log warning, so we know
          logger.logWarning(
            'A style with filter capabilities was set on the layer, but no fields were read from vector data. Make sure source.featureInfo?.outfields has values.'
          );
          return undefined;
        }

        this.#normalizeVisibility(styleSettings);
        if (this.#allFeaturesVisible(styleSettings.info)) return undefined;

        // Build query
        return this.#buildQueryUniqueValue(styleSettings, outFields);
      }

      case 'classBreaks': {
        // Check if any fields were retrieved
        if (!outFields) {
          // Log warning, so we know
          logger.logWarning(
            'A style with filter capabilities was set on the layer, but no fields were read from vector data. Make sure source.featureInfo?.outfields has values.'
          );
          return undefined;
        }

        this.#normalizeVisibility(styleSettings);
        if (this.#allFeaturesVisible(styleSettings.info)) return undefined;
        return this.#buildQueryClassBreaksFilter(styleSettings, outFields);
      }

      default:
        return undefined;
    }
  }

  /**
   * Normalizes a style configuration by ensuring that all visibility flags
   * are explicitly set. Any undefined `visible` properties are defaulted to `true`
   * (meaning the feature is considered visible).
   * @param {TypeLayerStyleSettings} styleConfig - The style configuration object to normalize.
   * @returns {void}
   */
  static #normalizeVisibility(styleConfig: TypeLayerStyleSettings): void {
    styleConfig.info.forEach((s) => {
      // eslint-disable-next-line no-param-reassign
      if (s.visible === undefined) s.visible = true;
    });
  }

  /**
   * Determines whether all features in the style configuration are visible.
   * This is used to skip building a filter expression when no filtering is needed.
   * @param {TypeLayerStyleConfigInfo[]} settings - The style configuration entries defining visibility.
   * @returns {boolean} `true` if all features are visible; `false` if any are hidden or filtered.
   */
  static #allFeaturesVisible(settings: TypeLayerStyleConfigInfo[]): boolean {
    return settings.every((s) => s.visible);
  }

  /**
   * Builds a filter expression for a **unique value renderer** based on the layer
   * style configuration.
   * If the style configuration defines a default renderer (`hasDefault === true`)
   * **and** the default renderer is visible, the function instead builds a
   * negative filter (`NOT (...)`) from the unchecked non-default entries, since
   * the default renderer represents an implicit catch-all.
   * @param {TypeLayerStyleSettings} styleSettings The layer style settings containing renderer definitions
   * and visibility state.
   * @param {TypeOutfields[]} outFields Optional layer field metadata used to properly format field
   * values (e.g., quoting strings, numeric handling).
   * @param {boolean} [useExtraSpacingInFilter] When `true`, adds extra spacing and quotes to
   * improve readability or compatibility with certain filter consumers.
   * @returns {string} A filter expression string suitable for use in SQL-like or OGC filter
   * contexts. Returns a constant always-true (`1 = 1`) or always-false (`1 = 0`)
   * expression when appropriate.
   * @private
   */
  static #buildQueryUniqueValue(
    styleSettings: TypeLayerStyleSettings,
    outFields: TypeOutfields[],
    useExtraSpacingInFilter: boolean = false
  ): string {
    const spacing = useExtraSpacingInFilter ? ' ' : '';
    const quote = useExtraSpacingInFilter ? '"' : '';
    const fieldName = styleSettings.fields[0];
    const fieldNameTweaked = `${quote}${fieldName}${quote}`;

    const { info, hasDefault } = styleSettings;

    const defaultIndex = info.length - 1;
    const defaultEntry = hasDefault ? info[defaultIndex] : undefined;
    const defaultIsChecked = Boolean(defaultEntry?.visible);

    // Decide strategy
    const useNotPattern = hasDefault && defaultIsChecked;

    const relevantInfos = useNotPattern
      ? // Exclude unchecked non-default styles
        info.slice(0, defaultIndex).filter((i) => !i.visible)
      : // Include checked non-default styles
        info.slice(0, hasDefault ? defaultIndex : info.length).filter((i) => i.visible);

    // Default checked and nothing to exclude → everything matches
    if (useNotPattern && relevantInfos.length === 0) {
      return this.DEFAULT_FILTER_1EQUALS1;
    }

    const values = relevantInfos.map((entry) => this.#formatFieldValue(fieldName, entry.values[0], outFields));

    // No values → nothing matches
    if (values.length === 0) {
      return this.DEFAULT_FILTER_1EQUALS0;
    }

    // Single value → equality
    const inClause =
      values.length === 1 ? `${fieldNameTweaked} = ${values[0]}` : `${fieldNameTweaked} in (${spacing}${values.join(`, `)}${spacing})`;

    return useNotPattern ? `NOT (${inClause})` : inClause;
  }

  /**
   * Builds a filter for "classBreaks" style types.
   * @param {TypeLayerStyleSettings} styleSettings - The style configuration.
   * @param {TypeOutfields[]} outfields - The feature info fields.
   * @returns {string} A filter expression string suitable for use in SQL-like or OGC filter
   * contexts. Returns a constant always-true (`1 = 1`) or always-false (`1 = 0`)
   * expression when appropriate.
   */
  static #buildQueryClassBreaksFilter(styleSettings: TypeLayerStyleSettings, outfields: TypeOutfields[]): string {
    const field = styleSettings.fields[0];
    const { info } = styleSettings;
    const { hasDefault } = styleSettings;
    const featureInfo = outfields;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fmt = (value: any): string => this.#formatFieldValue(field, value, featureInfo);

    const filterArray: string[] = [];
    let visibleWhenGreaterIndex = -1;

    for (let i = 0; i < info.length; i++) {
      const entry = info[i];
      const comparer0: TypeLayerStyleValueCondition = entry.valuesConditions?.[0] || '>=';
      const comparer1: TypeLayerStyleValueCondition = entry.valuesConditions?.[1] || '<=';

      // Determine even/odd based on filterArray length
      if (filterArray.length % 2 === 0) {
        // Even index logic (first half of a range)
        if (i === 0) {
          // First entry
          if (entry.visible !== false && (!hasDefault || (hasDefault && info[info.length - 1].visible === false))) {
            // visible, default not visible
            filterArray.push(`${field} ${comparer0} ${fmt(entry.values[0])}`);
          } else if (entry.visible === false && hasDefault && info[info.length - 1].visible !== false) {
            // not visible, default visible
            filterArray.push(`${field} ${comparer0} ${fmt(entry.values[0])}`);
            visibleWhenGreaterIndex = i;
          }
        } else {
          if (entry.visible !== false && (!hasDefault || (hasDefault && info[info.length - 1].visible === false))) {
            filterArray.push(`${field} ${comparer0} ${fmt(entry.values[0])}`);
            if (i + 1 === info.length) {
              filterArray.push(`${field} ${comparer1} ${fmt(entry.values[1])}`);
            }
          } else if (entry.visible === false && hasDefault && info[info.length - 1].visible !== false) {
            filterArray.push(`${field} ${comparer0} ${fmt(entry.values[0])}`);
            visibleWhenGreaterIndex = i;
          }
        }
      } else {
        // Odd index logic (closing half of a range)
        if (!hasDefault || (hasDefault && info[info.length - 1].visible === false)) {
          if (entry.visible === false) {
            filterArray.push(`${field} ${comparer1} ${fmt(info[i - 1].values[1])}`);
          } else if (i + 1 === info.length) {
            filterArray.push(`${field} ${comparer1} ${fmt(entry.values[1])}`);
          }
        } else if (hasDefault && entry.visible !== false) {
          filterArray.push(`${field} ${comparer1} ${fmt(info[i - 1].values[1])}`);
          visibleWhenGreaterIndex = -1;
        } else {
          visibleWhenGreaterIndex = i;
        }
      }
    }

    // Final "greater than" clause
    if (visibleWhenGreaterIndex !== -1) {
      filterArray.push(`${field} > ${fmt(info[visibleWhenGreaterIndex].values[1])}`);
    }

    // Return the filter
    return this.#buildClassBreakExpression(filterArray, hasDefault, info);
  }

  /**
   * Builds the final SQL-like boolean filter expression used for "classBreaks" style rules.
   * This function takes the list of already-constructed range conditions (`filterArray`)
   * and assembles them into a properly parenthesized logical expression. The structure
   * of the expression depends on whether the style has a “default” class and whether
   * that default class is visible or not.
   * Behavior:
   * - If no filters exist, returns `(1=0)` which represents a false filter (select nothing).
   * - If `hasDefault` is `true` **and** the last class in `info` is visible, the function
   *   constructs an `OR`-based expression that mirrors the original ArcGIS classBreaks
   *   logic where the default class is considered visible.
   * - Otherwise (default not visible), constructs a nested sequence of `AND`/`OR` blocks
   *   following the original Esri filtering algorithm, ensuring that non-visible classes
   *   properly constrain the final range.
   * @param {string[]} filterArray - The ordered list of base range expressions
   *   (e.g., `["field >= 1", "field <= 5", "field > 10", "field <= 20"]`) produced by
   *   the classBreaks preprocessing logic.
   * @param {boolean} hasDefault - Indicates whether the style definition includes a
   *   "default" class (the implicit class beyond the listed break ranges).
   * @param {TypeLayerStyleConfigInfo[]} info - The style configuration entries. Used
   *   primarily to determine visibility of the last class when `hasDefault` is true.
   * @returns {string} A fully assembled boolean expression such as:
   *   - `(1=0)` when nothing should match,
   *   - `(field >= 1 and field <= 5)`,
   *   - `((field >= 1 and field <= 5) or (field > 10 and field <= 20))`,
   *   - or more complex nested expressions depending on break visibility.
   */
  static #buildClassBreakExpression(filterArray: string[], hasDefault: boolean, info: TypeLayerStyleConfigInfo[]): string {
    if (filterArray.length === 0) return this.DEFAULT_FILTER_1EQUALS0;

    // Default visible / has default AND last class visible
    if (hasDefault && info[info.length - 1].visible !== false) {
      const expr = `${filterArray.slice(0, -1).reduce((prev, node, i) => {
        if (i === 0) return `(${node} or `;
        if (i % 2 === 0) return `${prev} and ${node}) or `;
        return `${prev}(${node}`;
      }, '')}${filterArray.at(-1)})`;

      return expr;
    }

    // Default not visible
    return `${filterArray.reduce((prev, node, i) => {
      if (i === 0) return `((${node} and `;
      if (i % 2 === 0) return `${prev} or (${node} and `;
      return `${prev}${node})`;
    }, '')})`;
  }

  /**
   * Formats the field value to use in the query.
   * @param {string} fieldName - The field name.
   * @param {unknown} rawValue - The unformatted field value.
   * @param {TypeOutfields[] | undefined} outFields - The outfields information that knows the field type.
   * @returns {string} The resulting field value.
   * @private
   */
  static #formatFieldValue(fieldName: string, rawValue: unknown, outFields: TypeOutfields[] | undefined): string {
    const fieldEntry = outFields?.find((outField) => outField.name === fieldName);
    const fieldType = fieldEntry?.type;
    switch (fieldType) {
      case 'date':
        return `date '${rawValue}'`;
      case 'string': {
        // Double the quotes
        const value = `${rawValue}`.replaceAll("'", "''");
        return `'${value}'`;
      }
      default: {
        // Should be a number, check it in case...
        const number = Number(rawValue);

        // If is NaN
        if (Number.isNaN(number)) return '0'; // We were tricked, it's not a numeric value, use 0 for now..
        return `${number}`; // All good
      }
    }
  }
} // END CLASS
