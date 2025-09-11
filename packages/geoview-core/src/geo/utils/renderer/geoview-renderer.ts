import { asArray, asString } from 'ol/color';
import { Style, Stroke, Fill, RegularShape, Circle as StyleCircle, Icon as StyleIcon } from 'ol/style';
import { Geometry, LineString, Point, Polygon } from 'ol/geom';
import Icon, { Options as IconOptions } from 'ol/style/Icon';
import { Options as CircleOptions } from 'ol/style/Circle';
import { Options as RegularShapeOptions } from 'ol/style/RegularShape';
import { Options as StrokeOptions } from 'ol/style/Stroke';
import { Options as FillOptions } from 'ol/style/Fill';
import Feature, { FeatureLike } from 'ol/Feature';
import { toContext } from 'ol/render';

import { setAlphaColor } from '@/core/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';
import {
  isFilledPolygonVectorConfig,
  isIconSymbolVectorConfig,
  isLineStringVectorConfig,
  isSimpleSymbolVectorConfig,
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
  TypeAliasLookup,
  codedValueType,
} from '@/api/config/types/map-schema-types';
import { TypeLayerMetadataFields } from '@/api/config/types/layer-schema-types';
import {
  binaryKeywors,
  defaultColor,
  FillPaternLine,
  FillPaternSettings,
  FilterNodeType,
  groupKeywords,
  NodeType,
  operatorPriority,
  unaryKeywords,
} from './geoview-renderer-types';
import { TypeVectorLayerStyles } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { logger } from '@/core/utils/logger';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

type TypeStyleProcessor = (
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[],
  legendFilterIsOff?: boolean,
  domainsLookup?: TypeLayerMetadataFields[],
  aliasLookup?: TypeAliasLookup
) => Style | undefined;

let colorCount = 0;

/**
 * Get the default color using the default color index.
 *
 * @param {number} alpha - Alpha value to associate to the color.
 * @param {boolean} increment - True, if we want to skip to next color
 *
 * @returns {string} The current default color string.
 */
// TODO: create a mechanism to have one counter by map if needed with a small class who reuse the static function
function getDefaultColor(alpha: number, increment = false): string {
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
 */
export const getGeometryType = (feature: FeatureLike): TypeStyleGeometry => {
  const geometryType = feature.getGeometry()?.getType();
  if (!geometryType) throw new Error('Features must have a geometry type.');
  return (geometryType.startsWith('Multi') ? geometryType.slice(5) : geometryType) as TypeStyleGeometry;
};

/** Table used to define line symbology to use when drawing lineString and polygon perimeters */
const lineDashSettings: Record<TypeLineStyle, number[] | undefined> = {
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
const fillPaternSettings: FillPaternSettings = {
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

/** Default value of the legend canvas width when the settings do not provide one. */
const LEGEND_CANVAS_WIDTH = 50;

/** Default value of the legend canvas height when the settings do not provide one. */
const LEGEND_CANVAS_HEIGHT = 50;

/**
 * This method loads the image of an icon that compose the legend.
 *
 * @param {string} src - Source information (base64 image) of the image to load.
 *
 * @returns {Promise<HTMLImageElement>} A promise that the image is loaded.
 */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  const promisedImage = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.src = src;
    image
      .decode()
      .then(() => resolve(image))
      .catch((error: unknown) => {
        logger.logError('GeoviewRenderer.loadImage(src) - Error while loading the src image =', src, error);
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
 */
async function createIconCanvas(pointStyle?: Style): Promise<HTMLCanvasElement | null> {
  try {
    const iconStyle = pointStyle?.getImage() as Icon;
    const image = await loadImage(iconStyle.getSrc()!);
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
 */
function createPointCanvas(pointStyle?: Style): HTMLCanvasElement {
  const size = pointStyle!.getImage()!.getSize();
  const [width, height] = Array.isArray(size) ? size : [LEGEND_CANVAS_WIDTH, LEGEND_CANVAS_HEIGHT];
  const drawingCanvas = document.createElement('canvas');
  drawingCanvas.width = width + 4;
  drawingCanvas.height = height + 4;
  const drawingContext = toContext(drawingCanvas.getContext('2d', { willReadFrequently: true })!);
  drawingContext.setStyle(pointStyle!);
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
 */
function createLineStringCanvas(lineStringStyle?: Style): HTMLCanvasElement {
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
 */
function createPolygonCanvas(polygonStyle?: Style): HTMLCanvasElement {
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
 */
function createStrokeOptions(settings: TypeSimpleSymbolVectorConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig): StrokeOptions {
  // eslint-disable-next-line no-param-reassign
  if (settings.stroke === undefined) settings.stroke = {};
  if (settings.stroke.color === undefined) {
    // eslint-disable-next-line no-param-reassign
    if ('color' in settings) settings.stroke.color = asString(setAlphaColor(asArray((settings as TypeSimpleSymbolVectorConfig).color!), 1));
    // eslint-disable-next-line no-param-reassign
    else settings.stroke.color = getDefaultColor(1, true);
  }
  const strokeOptions: StrokeOptions = {
    color: settings.stroke?.color,
    width: settings.stroke?.width,
    lineCap: 'butt',
    lineJoin: 'bevel',
    lineDash: lineDashSettings[settings.stroke?.lineStyle !== undefined ? settings.stroke?.lineStyle : 'solid'],
  };
  return strokeOptions;
}

/**
 * Execute an operator using the nodes on the data stack. The filter equation is evaluated using a postfix notation. The result
 * is pushed back on the data stack. If a problem is detected, an error object is thrown with an explanatory message.
 *
 * @param {FilterNodeType} operator - Operator to execute.
 * @param {FilterNodeType[]} dataStack - Data stack to use for the operator execution.
 */
function executeOperator(operator: FilterNodeType, dataStack: FilterNodeType[]): void {
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
          if (operand1.nodeValue === null || operand2.nodeValue === null) dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
          else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue === operand2.nodeValue });
          break;
        case '<':
          if (operand1.nodeValue === null || operand2.nodeValue === null) dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
          else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue < operand2.nodeValue });
          break;
        case '>':
          if (operand1.nodeValue === null || operand2.nodeValue === null) dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
          else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue > operand2.nodeValue });
          break;
        case '<=':
          if (operand1.nodeValue === null || operand2.nodeValue === null) dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
          else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue <= operand2.nodeValue });
          break;
        case '>=':
          if (operand1.nodeValue === null || operand2.nodeValue === null) dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
          else dataStack.push({ nodeType: NodeType.variable, nodeValue: operand1.nodeValue >= operand2.nodeValue });
          break;
        case '<>':
          if (operand1.nodeValue === null || operand2.nodeValue === null) dataStack.push({ nodeType: NodeType.variable, nodeValue: null });
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
          else if (typeof operand1.nodeValue !== 'boolean' || typeof operand2.nodeValue !== 'boolean') throw new Error(`or operator error`);
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
 */
function featureIsNotVisible(feature: Feature, filterEquation: FilterNodeType[]): boolean | undefined {
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
          for (; operatorOnTop1 && operatorOnTop1.nodeValue !== '('; executeOperator(operatorStack.pop()!, dataStack))
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
          executeOperator(operatorStack.pop()!, dataStack)
        )
          operatorOnTop2 = operatorAt(-2, operatorStack);
        operatorStack.push({ ...filterEquation[i] });
      }
    }
    for (
      let operatorOnTop3 = operatorAt(-1, operatorStack);
      operatorOnTop3 && operatorOnTop3.nodeValue !== '(';
      executeOperator(operatorStack.pop()!, dataStack)
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
 */
function processCircleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
  // eslint-disable-next-line no-param-reassign
  if (settings.color === undefined) settings.color = getDefaultColor(0.25, true);
  const fillOptions: FillOptions = { color: settings.color };
  const strokeOptions: StrokeOptions = createStrokeOptions(settings);
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
 */
function processStarShapeSymbol(settings: TypeSimpleSymbolVectorConfig, points: number, angle: number): Style | undefined {
  // eslint-disable-next-line no-param-reassign
  if (settings.color === undefined) settings.color = getDefaultColor(0.25, true);
  const fillOptions: FillOptions = { color: settings.color };
  const strokeOptions: StrokeOptions = createStrokeOptions(settings);
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
 */
function processStarSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
  return processStarShapeSymbol(settings, 5, 0);
}

/**
 * Process a X symbol using the settings.
 *
 * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processXSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
  return processStarShapeSymbol(settings, 4, Math.PI / 4);
}

/**
 * Process a + symbol using the settings.
 *
 * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processPlusSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
  return processStarShapeSymbol(settings, 4, 0);
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
 */
function processRegularShape(
  settings: TypeSimpleSymbolVectorConfig,
  points: number,
  angle: number,
  scale: [number, number]
): Style | undefined {
  // eslint-disable-next-line no-param-reassign
  if (settings.color === undefined) settings.color = getDefaultColor(0.25, true);
  const fillOptions: FillOptions = { color: settings.color };
  const strokeOptions: StrokeOptions = createStrokeOptions(settings);
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
 */
function processSquareSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
  return processRegularShape(settings, 4, Math.PI / 4, [1, 1]);
}

/**
 * Process a Diamond symbol using the settings.
 *
 * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processDiamondSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
  return processRegularShape(settings, 4, 0, [0.75, 1]);
}

/**
 * Process a triangle symbol using the settings.
 *
 * @param {TypeSimpleSymbolVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processTriangleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
  return processRegularShape(settings, 3, 0, [1, 1]);
}

/**
 * Process an icon symbol using the settings.
 *
 * @param {TypeIconSymbolVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processIconSymbol(settings: TypeIconSymbolVectorConfig): Style | undefined {
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

/** Table of function to process simpleSymbol settings. */
const processSymbol: Record<TypeSymbol, (settings: TypeSimpleSymbolVectorConfig) => Style | undefined> = {
  circle: processCircleSymbol,
  '+': processPlusSymbol,
  diamond: processDiamondSymbol,
  square: processSquareSymbol,
  triangle: processTriangleSymbol,
  X: processXSymbol,
  star: processStarSymbol,
};

/**
 * Process a simple point symbol using the settings. Simple point symbol may be an icon or a vector symbol.
 *
 * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Settings to use for the Style creation.
 * @param {Feature} feature - Optional feature. This method does not use it, it is there to have a homogeneous signature.
 * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processSimplePoint(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[]
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  const settings = (styleSettings.type === 'simple' ? styleSettings.info[0].settings : styleSettings) as TypeKindOfVectorSettings;
  if (isSimpleSymbolVectorConfig(settings)) {
    const { symbol } = settings;
    return processSymbol[symbol].call('', settings);
  }
  if (isIconSymbolVectorConfig(settings)) return processIconSymbol(settings);
  return undefined;
}

/**
 * Process a simple lineString using the settings.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Settings to use for the Style creation.
 * @param {Feature} feature - Optional feature. This method does not use it, it is there to have a homogeneous signature.
 * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processSimpleLineString(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[]
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  const settings = (styleSettings.type === 'simple' ? styleSettings.info[0].settings : styleSettings) as TypeKindOfVectorSettings;
  let geometry;
  if (feature) {
    geometry = feature.getGeometry() as Geometry;
  }
  if (isLineStringVectorConfig(settings)) {
    const strokeOptions: StrokeOptions = createStrokeOptions(settings);
    return new Style({ stroke: new Stroke(strokeOptions), geometry });
  }
  return undefined;
}

/**
 * Process a simple solid fill (polygon) using the settings.
 *
 * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processSolidFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
  // eslint-disable-next-line no-param-reassign
  if (settings.color === undefined) settings.color = getDefaultColor(0.25, true);
  const fillOptions: FillOptions = { color: settings.color };
  const strokeOptions: StrokeOptions = createStrokeOptions(settings);
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
 */
function processNullFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
  // eslint-disable-next-line no-param-reassign
  if (settings.color === undefined) settings.color = getDefaultColor(0, true);
  const fillOptions: FillOptions = { color: settings.color };
  const strokeOptions: StrokeOptions = createStrokeOptions(settings);
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
 * @param {FillPaternLine[]} fillPaternLines - Fill patern lines needed to create the fill.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processPaternFill(settings: TypePolygonVectorConfig, fillPaternLines: FillPaternLine[], geometry?: Geometry): Style | undefined {
  const paternSize = settings.paternSize !== undefined ? settings.paternSize : 8;
  // eslint-disable-next-line no-param-reassign
  if (settings.color === undefined) settings.color = getDefaultColor(0.25, true);
  const fillOptions: FillOptions = { color: settings.color };
  const strokeOptions: StrokeOptions = createStrokeOptions(settings);

  // Canvas used to create the pattern fill. It is bigger to take into account the repeating aspect of the fill.
  const drawingCanvas = document.createElement('canvas');
  drawingCanvas.width = paternSize * 2;
  drawingCanvas.height = paternSize * 2;
  const context = drawingCanvas.getContext('2d', { willReadFrequently: true });
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
  const outputContext = outputCanvas.getContext('2d', { willReadFrequently: true });
  outputContext!.putImageData(context!.getImageData(paternSize / 2, paternSize / 2, paternSize, paternSize), 0, 0);

  fillOptions.color = outputContext!.createPattern(outputCanvas, 'repeat');
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
 */
function processBackwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
  return processPaternFill(settings, fillPaternSettings.backwardDiagonal, geometry);
}

/**
 * Process a forward diagonal fill using the settings.
 *
 * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processForwardDiagonalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
  return processPaternFill(settings, fillPaternSettings.forwardDiagonal, geometry);
}

/**
 * Process a cross fill using the settings.
 *
 * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
  return processPaternFill(settings, fillPaternSettings.cross, geometry);
}

/**
 * Process a diagonal cross fill using the settings.
 *
 * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processDiagonalCrossFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
  return processPaternFill(settings, fillPaternSettings.diagonalCross, geometry);
}

/**
 * Process a horizontal fill using the settings.
 *
 * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processHorizontalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
  return processPaternFill(settings, fillPaternSettings.horizontal, geometry);
}

/**
 * Process a vertical fill using the settings.
 *
 * @param {TypePolygonVectorConfig} settings - Settings to use for the Style creation.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processVerticalFill(settings: TypePolygonVectorConfig, geometry?: Geometry): Style | undefined {
  return processPaternFill(settings, fillPaternSettings.vertical, geometry);
}

/** Table of function to process polygon fill style settings. */
const processFillStyle: Record<TypeFillStyle, (settings: TypePolygonVectorConfig, geometry?: Geometry) => Style | undefined> = {
  null: processNullFill,
  solid: processSolidFill,
  backwardDiagonal: processBackwardDiagonalFill,
  cross: processCrossFill,
  diagonalCross: processDiagonalCrossFill,
  forwardDiagonal: processForwardDiagonalFill,
  horizontal: processHorizontalFill,
  vertical: processVerticalFill,
};

/**
 * Process a simple polygon using the settings.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Settings to use for the Style creation.
 * @param {Feature} feature - Optional feature. This method does not use it, it is there to have a homogeneous signature.
 * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
 *
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processSimplePolygon(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[]
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  const settings = (styleSettings.type === 'simple' ? styleSettings.info[0].settings : styleSettings) as TypeKindOfVectorSettings;
  let geometry;
  if (feature) {
    geometry = feature.getGeometry() as Geometry;
  }
  if (isFilledPolygonVectorConfig(settings)) {
    const { fillStyle } = settings; // TODO: refactor - introduce by moving to config map schema type
    if (geometry !== undefined) {
      return processFillStyle[fillStyle].call('', settings, geometry);
    }
    return processFillStyle[fillStyle].call('', settings);
  }
  return undefined;
}

// #endregion PROCESS RENDERER

/**
 * This method is used to process the array of point styles as described in the pointStyleConfig.
 *
 * @param {TypeVectorLayerStyles} layerStyle - Object that will receive the created canvas.
 * @param {TypeLayerStyleConfigInfo[]} arrayOfPointStyleConfig - Array of point style configuration.
 * @param {(value: TypeVectorLayerStyles | PromiseLike<TypeVectorLayerStyles>) => void} resolve - Function that will resolve the promise
 * of the calling methode.
 *
 * @returns {Promise<TypeVectorLayerStyles>} A promise that the vector layer style is created.
 */
async function processArrayOfPointStyleConfig(
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
        promiseOfCanvasCreated.push(createIconCanvas(processSimplePoint(arrayOfPointStyleConfig[i].settings)));
      // Simple vector symbol =======================================================================================
      else
        promiseOfCanvasCreated.push(
          new Promise<HTMLCanvasElement | null>((resolveSimpleVectorSymbol) => {
            resolveSimpleVectorSymbol(createPointCanvas(processSimplePoint(arrayOfPointStyleConfig[i].settings)));
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
 */
async function getPointStyleSubRoutine(
  defaultSettings?: TypeKindOfVectorSettings,
  arrayOfPointStyleConfig?: TypeLayerStyleConfigInfo[]
): Promise<TypeVectorLayerStyles> {
  try {
    const layerStyles: TypeVectorLayerStyles = { Point: {} };
    if (defaultSettings) {
      if (isIconSymbolVectorConfig(defaultSettings)) {
        // Icon symbol ======================================================================================
        const canvas = await createIconCanvas(processSimplePoint(defaultSettings));
        layerStyles.Point!.defaultCanvas = canvas;
        if (arrayOfPointStyleConfig) {
          layerStyles.Point!.arrayOfCanvas = [];
          const processedStyles = await processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig);
          processedStyles.Point?.arrayOfCanvas?.pop();
          return processedStyles;
        }
        return layerStyles;
      }

      // Simple vector symbol =============================================================================
      layerStyles.Point!.defaultCanvas = createPointCanvas(processSimplePoint(defaultSettings));
      if (arrayOfPointStyleConfig) {
        layerStyles.Point!.arrayOfCanvas = [];
        const processedStyles = await processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig);
        processedStyles.Point?.arrayOfCanvas?.pop();
        return processedStyles;
      }
      return layerStyles;
    }

    layerStyles.Point!.arrayOfCanvas = [];
    return await processArrayOfPointStyleConfig(layerStyles, arrayOfPointStyleConfig!);
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
 */
export async function getLegendStyles(styleConfig: TypeLayerStyleConfig | undefined): Promise<TypeVectorLayerStyles> {
  try {
    if (!styleConfig) return {};
    const legendStyles: TypeVectorLayerStyles = {};
    if (styleConfig.Point) {
      // ======================================================================================================================
      // Point style configuration ============================================================================================
      if (styleConfig.Point.type === 'simple') {
        const layerStyles = await getPointStyleSubRoutine(styleConfig.Point.info[0].settings);
        legendStyles.Point = layerStyles.Point;
      } else {
        const defaultSettings = styleConfig.Point.hasDefault
          ? styleConfig.Point.info[styleConfig.Point.info.length - 1].settings
          : undefined;
        const layerStyles = await getPointStyleSubRoutine(defaultSettings, styleConfig.Point.info);
        legendStyles.Point = layerStyles.Point;
      }
    }

    if (styleConfig.LineString) {
      // ======================================================================================================================
      // LineString style configuration =======================================================================================
      const layerStyles: TypeVectorLayerStyles = { LineString: {} };
      if (styleConfig.LineString.type === 'simple') {
        layerStyles.LineString!.defaultCanvas = createLineStringCanvas(processSimpleLineString(styleConfig.LineString));
      } else {
        if (styleConfig.LineString.hasDefault)
          layerStyles.LineString!.defaultCanvas = createLineStringCanvas(
            processSimpleLineString(styleConfig.LineString.info[styleConfig.LineString.info.length - 1].settings)
          );
        const styleArray: HTMLCanvasElement[] = [];
        styleConfig.LineString.info.forEach((styleInfo) => {
          styleArray.push(createLineStringCanvas(processSimpleLineString(styleInfo.settings)));
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
        layerStyles.Polygon!.defaultCanvas = createPolygonCanvas(processSimplePolygon(styleConfig.Polygon.info[0].settings));
      } else {
        if (styleConfig.Polygon.hasDefault)
          layerStyles.Polygon!.defaultCanvas = createPolygonCanvas(
            processSimplePolygon(styleConfig.Polygon.info[styleConfig.Polygon.info.length - 1].settings)
          );

        const styleArray: HTMLCanvasElement[] = [];
        styleConfig.Polygon.info.forEach((styleInfo) => {
          styleArray.push(createPolygonCanvas(processSimplePolygon(styleInfo.settings)));
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
 */
function createDefaultStyle(geometryType: TypeStyleGeometry, label: string): TypeLayerStyleSettings | undefined {
  if (geometryType === 'Point') {
    const settings: TypeSimpleSymbolVectorConfig = {
      type: 'simpleSymbol',
      color: getDefaultColor(0.25),
      stroke: {
        color: getDefaultColor(1, true),
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
      stroke: { color: getDefaultColor(1, true) },
    };
    return { type: 'simple', hasDefault: false, fields: [], info: [{ visible: true, label, settings, values: [] }] };
  }
  if (geometryType === 'Polygon') {
    const settings: TypePolygonVectorConfig = {
      type: 'filledPolygon',
      color: getDefaultColor(0.25),
      stroke: { color: getDefaultColor(1, true) },
      fillStyle: 'solid',
    };
    return { type: 'simple', hasDefault: false, fields: [], info: [{ visible: true, label, settings, values: [] }] };
  }
  logger.logError(`Geometry type ${geometryType} is not supported by the GeoView viewer.`);
  return undefined;
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
 */
function searchUniqueValueEntry(
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
      const expectedRawValue = uniqueValueStyleInfo[i].values[j];
      const expectedValue = typeof expectedRawValue === 'string' ? expectedRawValue.replace("''", "'") : expectedRawValue;

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
 * @param {FilterNodeType[]?} filterEquation - Filter equation associated to the layer.
 * @param {boolean?} legendFilterIsOff - When true, do not apply legend filter.
 * @param {TypeLayerMetadataFields[]?} domainsLookup - An optional lookup table to handle coded value domains.
 * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processUniqueValuePoint(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[],
  legendFilterIsOff?: boolean,
  domainsLookup?: TypeLayerMetadataFields[],
  aliasLookup?: TypeAliasLookup
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  if (styleSettings.type === 'uniqueValue') {
    const { hasDefault, fields, info } = styleSettings;
    const styleEntry = searchUniqueValueEntry(fields, info, feature, domainsLookup, aliasLookup);
    if (styleEntry !== undefined && (legendFilterIsOff || styleEntry.visible !== false)) return processSimplePoint(styleEntry.settings);

    // TODO: Check - Why look for styleSettings.info.length - 1?
    if (
      styleEntry === undefined &&
      hasDefault &&
      (legendFilterIsOff || styleSettings.info[styleSettings.info.length - 1].visible !== false)
    )
      return processSimplePoint(styleSettings.info[styleSettings.info.length - 1].settings);
  }
  return undefined;
}

/**
 * Process the unique value settings using a lineString feature to get its Style.
 *
 * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
 * @param {Feature?} feature - Feature used to test the unique value conditions.
 * @param {FilterNodeType[]?} filterEquation - Filter equation associated to the layer.
 * @param {boolean?} legendFilterIsOff - When true, do not apply legend filter.
 * @param {TypeLayerMetadataFields[]?} domainsLookup - An optional lookup table to handle coded value domains.
 * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processUniqueLineString(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[],
  legendFilterIsOff?: boolean,
  domainsLookup?: TypeLayerMetadataFields[],
  aliasLookup?: TypeAliasLookup
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  if (styleSettings.type === 'uniqueValue') {
    const { hasDefault, fields, info } = styleSettings;
    const styleEntry = searchUniqueValueEntry(fields, info, feature, domainsLookup, aliasLookup);
    if (styleEntry !== undefined && (legendFilterIsOff || styleEntry.visible !== false))
      return processSimpleLineString(styleEntry.settings, feature);

    // TODO: Check - Why look for info.length - 1?
    if (styleEntry === undefined && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false))
      return processSimpleLineString(info[info.length - 1].settings, feature);
  }
  return undefined;
}

/**
 * Process the unique value settings using a polygon feature to get its Style.
 *
 * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
 * @param {Feature?} feature - Feature used to test the unique value conditions.
 * @param {FilterNodeType[]?} filterEquation - Filter equation associated to the layer.
 * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
 * @param {TypeLayerMetadataFields[]?} domainsLookup - An optional lookup table to handle coded value domains.
 * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processUniquePolygon(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[],
  legendFilterIsOff?: boolean,
  domainsLookup?: TypeLayerMetadataFields[],
  aliasLookup?: TypeAliasLookup
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  if (styleSettings.type === 'uniqueValue') {
    const { hasDefault, fields, info } = styleSettings;
    const styleEntry = searchUniqueValueEntry(fields, info, feature, domainsLookup, aliasLookup);
    if (styleEntry !== undefined && (legendFilterIsOff || styleEntry.visible !== false))
      return processSimplePolygon(styleEntry.settings, feature);

    // TODO: Check - Why look for info.length - 1?
    if (styleEntry === undefined && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false))
      return processSimplePolygon(info[info.length - 1].settings, feature);
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
 */
function searchClassBreakEntry(
  field: string,
  classBreakStyleInfo: TypeLayerStyleConfigInfo[],
  feature: Feature,
  aliasLookup?: TypeAliasLookup
): number | undefined {
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

  const fieldValue = feature.get(featureKey[0]) as number | string;

  if (fieldValue >= classBreakStyleInfo[0].values[0] && fieldValue <= classBreakStyleInfo[0].values[1]) return 0;

  for (let i = 1; i < classBreakStyleInfo.length; i++) {
    if (fieldValue > classBreakStyleInfo[i].values[0] && fieldValue <= classBreakStyleInfo[i].values[1]) return i;
  }
  return undefined;
}

/**
 * Process the class break settings using a Point feature to get its Style.
 *
 * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
 * @param {Feature} feature - Feature used to test the unique value conditions.
 * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
 * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
 * @param {TypeLayerMetadataFields[]?} domainsLookup - An optional lookup table to handle coded value domains.
 * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processClassBreaksPoint(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[],
  legendFilterIsOff?: boolean,
  domainsLookup?: TypeLayerMetadataFields[],
  aliasLookup?: TypeAliasLookup
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  if (styleSettings.type === 'classBreaks') {
    const { hasDefault, fields, info } = styleSettings;
    const i = searchClassBreakEntry(fields[0], info, feature!, aliasLookup);
    if (i !== undefined && (legendFilterIsOff || info[i].visible !== false)) return processSimplePoint(info[i].settings);
    if (i === undefined && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false))
      return processSimplePoint(info[info.length - 1].settings);
  }
  return undefined;
}

/**
 * Process the class break settings using a lineString feature to get its Style.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
 * @param {Feature} feature - Feature used to test the unique value conditions.
 * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
 * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
 * @param {TypeLayerMetadataFields[]?} domainsLookup - An optional lookup table to handle coded value domains.
 * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processClassBreaksLineString(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[],
  legendFilterIsOff?: boolean,
  domainsLookup?: TypeLayerMetadataFields[],
  aliasLookup?: TypeAliasLookup
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  if (styleSettings.type === 'classBreaks') {
    const { hasDefault, fields, info } = styleSettings;
    const i = searchClassBreakEntry(fields[0], info, feature!, aliasLookup);
    if (i !== undefined && (legendFilterIsOff || info[i].visible !== false)) return processSimpleLineString(info[i].settings, feature);
    if (i === undefined && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false))
      return processSimpleLineString(info[info.length - 1].settings, feature);
  }
  return undefined;
}

/**
 * Process the class break settings using a Polygon feature to get its Style.
 *
 * @param {TypeLayerStyleSettings | TypeKindOfVectorSettings} styleSettings - Style settings to use.
 * @param {Feature} feature - Feature used to test the unique value conditions.
 * @param {FilterNodeType[]} filterEquation - Filter equation associated to the layer.
 * @param {boolean} legendFilterIsOff - When true, do not apply legend filter.
 * @param {TypeLayerMetadataFields[]?} domainsLookup - An optional lookup table to handle coded value domains.
 * @param {TypeAliasLookup?} aliasLookup - An optional lookup table to handle field name aliases.
 * @returns {Style | undefined} The Style created. Undefined if unable to create it.
 */
function processClassBreaksPolygon(
  styleSettings: TypeLayerStyleSettings | TypeKindOfVectorSettings,
  feature?: Feature,
  filterEquation?: FilterNodeType[],
  legendFilterIsOff?: boolean,
  domainsLookup?: TypeLayerMetadataFields[],
  aliasLookup?: TypeAliasLookup
): Style | undefined {
  if (filterEquation !== undefined && filterEquation.length !== 0 && feature)
    if (featureIsNotVisible(feature, filterEquation)) return undefined;

  if (styleSettings.type === 'classBreaks') {
    const { hasDefault, fields, info } = styleSettings;
    const i = searchClassBreakEntry(fields[0], info, feature!, aliasLookup);
    if (i !== undefined && (legendFilterIsOff || info[i].visible !== false)) return processSimplePolygon(info[i].settings, feature);
    if (i === undefined && hasDefault && (legendFilterIsOff || info[info.length - 1].visible !== false))
      return processSimplePolygon(info[info.length - 1].settings, feature);
  }
  return undefined;
}

/** Table of function to process the style settings based on the feature geometry and the kind of style settings. */
export const processStyle: Record<TypeLayerStyleConfigType, Record<TypeStyleGeometry, TypeStyleProcessor>> = {
  simple: {
    Point: processSimplePoint,
    MultiPoint: processSimplePoint,
    LineString: processSimpleLineString,
    MultiLineString: processSimpleLineString,
    Polygon: processSimplePolygon,
    MultiPolygon: processSimplePolygon,
  },
  uniqueValue: {
    Point: processUniqueValuePoint,
    MultiPoint: processUniqueValuePoint,
    LineString: processUniqueLineString,
    MultiLineString: processUniqueLineString,
    Polygon: processUniquePolygon,
    MultiPolygon: processUniquePolygon,
  },
  classBreaks: {
    Point: processClassBreaksPoint,
    MultiPoint: processClassBreaksPoint,
    LineString: processClassBreaksLineString,
    MultiLineString: processClassBreaksLineString,
    Polygon: processClassBreaksPolygon,
    MultiPolygon: processClassBreaksPolygon,
  },
};

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
export function getAndCreateFeatureStyle(
  feature: FeatureLike,
  style: TypeLayerStyleConfig,
  label: string,
  filterEquation?: FilterNodeType[],
  legendFilterIsOff?: boolean,
  aliasLookup?: TypeAliasLookup,
  callbackWhenCreatingStyle?: (geometryType: TypeStyleGeometry, style: TypeLayerStyleConfigInfo) => void
): Style | undefined {
  // Get the geometry type
  const geometryType = getGeometryType(feature);

  // The style to work on
  let styleWorkOn = style;

  // If style does not exist for the geometryType, create it.
  if (!style || !style[geometryType]) {
    // Create a style on-the-fly for the geometry type, because the layer config didn't have one already
    const styleConfig = createDefaultStyle(geometryType, label);

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
    const { type } = styleSettings;
    // TODO: Refactor - Rewrite this to use explicit function calls instead, for clarity and references finding
    const featureStyle = processStyle[type][geometryType].call(
      '',
      styleSettings,
      feature as Feature,
      filterEquation,
      legendFilterIsOff,
      undefined,
      aliasLookup
    );

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
 */
export function getFeatureImageSource(
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
    const geometryType = feature.getGeometry() ? getGeometryType(feature) : (Object.keys(style)[0] as TypeStyleGeometry);

    // Get the style accordingly to its type and geometry.
    if (style[geometryType]) {
      const styleSettings = style[geometryType];
      const { type } = styleSettings;

      // TODO: Performance #2688 - Wrap the style processing in a Promise to prevent blocking, Use requestAnimationFrame to process style during next frame
      // Wrap the style processing in a Promise to prevent blocking
      // return new Promise((resolve) => {
      //   // Use requestAnimationFrame to process style during next frame
      //   requestAnimationFrame(() => {
      //     const processedStyle = processStyle[type][geometryType].call(
      //       '',
      //       styleSettings,
      //       feature as Feature,
      //       filterEquation,
      //       legendFilterIsOff
      //     );
      //     resolve(processedStyle);
      //   });
      // });

      const featureStyle = processStyle[type][geometryType](
        styleSettings,
        feature,
        filterEquation,
        legendFilterIsOff,
        domainsLookup,
        aliasLookup
      );

      if (featureStyle) {
        if (geometryType === 'Point') {
          if (
            (styleSettings.type === 'simple' && !(featureStyle.getImage() instanceof Icon)) ||
            (styleSettings.type === 'uniqueValue' && !(featureStyle.getImage() instanceof Icon)) ||
            (styleSettings.type === 'classBreaks' && !(featureStyle.getImage() instanceof Icon))
          ) {
            imageSource = createPointCanvas(featureStyle).toDataURL();
          } else {
            imageSource = (featureStyle.getImage() as Icon).getSrc() || undefined;
          }
        } else if (geometryType === 'LineString') {
          imageSource = createLineStringCanvas(featureStyle).toDataURL();
        } else {
          imageSource = createPolygonCanvas(featureStyle).toDataURL();
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
 */
function classifyUnprocessedNodes(keywordArray: FilterNodeType[]): FilterNodeType[] {
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
 */
function extractKeyword(filterNodeArray: FilterNodeType[], keyword: string, regExp?: RegExp): FilterNodeType[] {
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
 */
function extractStrings(keywordArray: FilterNodeType[]): FilterNodeType[] {
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
 */
export function analyzeLayerFilter(filterNodeArrayType: FilterNodeType[]): FilterNodeType[] {
  let resultingKeywordArray = filterNodeArrayType;
  resultingKeywordArray[0].nodeValue = (resultingKeywordArray[0].nodeValue as string).replaceAll(/\s{2,}/g, ' ').trim();
  resultingKeywordArray[0].nodeValue = resultingKeywordArray[0].nodeValue.split(/^date '|(?<=\s)date '/gi).join("date°'");
  resultingKeywordArray = extractKeyword(resultingKeywordArray, "'");
  resultingKeywordArray = extractStrings(resultingKeywordArray);

  resultingKeywordArray = extractKeyword(resultingKeywordArray, '(');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, ')');
  if (
    resultingKeywordArray.reduce((result, node) => {
      return node.nodeType === NodeType.group ? result + 1 : result;
    }, 0) % 2
  )
    throw new Error(`unbalanced parentheses`);

  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'date', /^date°$|^date°|(?<=\s)date°/g);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'upper', /^upper\b|(?<=\s)upper\b/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'lower', /^lower\b|(?<=\s)lower\b/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'is not', /^is\s+not\b|(?<=\s)is\s+not\b/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'is', /^is\b(?!\s*not\b)|(?<=\s)is\b(?!\s*not\b)/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'in', /^in\b|(?<=\s)in\b/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, ',');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'not', /^not\b|(?<=\s)not\b/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'and', /^and\b|(?<=\s)and\b/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'or', /^or\b|(?<=\s)or\b/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, 'like', /^like\b|(?<=\s)like\b/gi);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '=', /(?<![><])=/g);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '<', /<(?![>=])/g);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '>', /(?<!<)>(?!=)/g);
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '<>');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '<=');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '>=');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '+');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '-');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '*');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '/');
  resultingKeywordArray = extractKeyword(resultingKeywordArray, '||');
  resultingKeywordArray = classifyUnprocessedNodes(resultingKeywordArray);

  return resultingKeywordArray;
}
