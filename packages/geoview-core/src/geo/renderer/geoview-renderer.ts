/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
import { asArray, asString } from 'ol/color';
import { Style, Stroke, Fill, RegularShape, Circle as StyleCircle, Icon as StyleIcon } from 'ol/style';
import { Options as IconOptions } from 'ol/style/Icon';
import { Options as CircleOptions } from 'ol/style/Circle';
import { Options as RegularShapeOptions } from 'ol/style/RegularShape';
import { Options as StrokeOptions } from 'ol/style/Stroke';
import { Options as FillOptions } from 'ol/style/Fill';
import { FeatureLike } from 'ol/Feature';

import { getLocalizedValue, setAlphaColor } from '../../core/utils/utilities';
import {
  isFilledPolygonVectorConfig,
  isIconSymbolVectorConfig,
  isLineStringVectorConfig,
  isSimpleSymbolVectorConfig,
  TypeBaseStyleType,
  TypeClassBreakStyleConfig,
  TypeClassBreakStyleInfo,
  TypeFillStyle,
  TypePolygonVectorConfig,
  TypeIconSymbolVectorConfig,
  TypeLineStyle,
  TypeLineStringVectorConfig,
  TypeSimpleStyleConfig,
  TypeSimpleSymbolVectorConfig,
  TypeStyleConfigKey,
  TypeStyleSettings,
  TypeSymbol,
  TypeUniqueValueStyleConfig,
  TypeUniqueValueStyleInfo,
  TypeVectorLayerEntryConfig,
  TypeVectorTileLayerEntryConfig,
  TypeBaseLayerEntryConfig,
  TypeStyleConfig,
  TypeKindOfVectorSettings,
  isSimpleStyleConfig,
  TypeBaseStyleConfig,
  isUniqueValueStyleConfig,
  isClassBreakStyleConfig,
  TypeBaseVectorConfig,
} from '../map/map-schema-types';
import { defaultColor } from './geoview-renderer-types';
import { Layer } from '../layer/layer';

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
  /** Table of function to process the style settings. */
  private processStyle: Record<
    TypeBaseStyleType,
    Record<TypeStyleConfigKey, (styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike) => Style | undefined>
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

  private styleNotImplemented(styleSettings: TypeStyleSettings, feature: FeatureLike): Style | undefined {
    // eslint-disable-next-line no-console
    console.log('Style processing function is not implemented.');
    return undefined;
  }

  private processSymbol: Record<TypeSymbol, (settings: TypeSimpleSymbolVectorConfig) => Style | undefined> = {
    circle: this.processCircleSymbol,
    '+': this.processPlusSymbol,
    diamond: this.processDiamondSymbol,
    square: this.processSquareSymbol,
    triangle: this.processTriangleSymbol,
    X: this.processXSymbol,
    star: this.processStarSymbol,
  };

  private processFillStyle: Record<TypeFillStyle, (settings: TypePolygonVectorConfig) => Style | undefined> = {
    null: this.processNullFill,
    solid: this.processSolidFill,
    backwardDiagonal: this.processBackwardDiagonalFill,
    cross: this.processCrossFill,
    diagonalCross: this.processDiagonalCrossFill,
    forwardDiagonal: this.processForwardDiagonalFill,
    horizontal: this.processHorizontalFill,
    vertical: this.processVerticalFill,
  };

  constructor(mapId: string) {
    this.mapId = mapId;
    this.defaultColorIndex = 0;
  }

  getStyle(
    feature: FeatureLike,
    layerEntryConfig: TypeBaseLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
  ): Style | undefined {
    const geometryType = feature.getGeometry()?.getType() as TypeStyleConfigKey;
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

  private incrementDefaultColorIndex() {
    this.defaultColorIndex++;
    if (this.defaultColorIndex === defaultColor.length) this.defaultColorIndex = 0;
  }

  private getDefaultColorAndIncrementIndex(alpha: number): string {
    const color = asString(setAlphaColor(asArray(defaultColor[this.defaultColorIndex]), alpha));
    this.incrementDefaultColorIndex();
    return color;
  }

  private getDefaultColor(alpha: number): string {
    return asString(setAlphaColor(asArray(defaultColor[this.defaultColorIndex]), alpha));
  }

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

  private processStarSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 5, 0);
  }

  private processXSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 4, Math.PI / 4);
  }

  private processPlusSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processStarShapeSymbol(settings, 4, 0);
  }

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

  private processSquareSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 4, Math.PI / 4, [1, 1]);
  }

  private processDiamondSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 4, 0, [0.75, 1]);
  }

  private processTriangleSymbol(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    return this.processRegularShape(settings, 3, 0, [1, 1]);
  }

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

  private processSimplePoint(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature: FeatureLike
  ): Style | undefined {
    const settings = (isSimpleStyleConfig(styleSettings) ? styleSettings.settings : styleSettings) as TypeBaseVectorConfig ;
    if (isSimpleSymbolVectorConfig(settings)) {
      const { symbol } = settings;
      return this.processSymbol[symbol].call(this, settings);
    }
    if (isIconSymbolVectorConfig(settings)) return this.processIconSymbol(settings);
    return undefined;
  }

  private processSimpleLineString(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature: FeatureLike
  ): Style | undefined {
    const { settings } = styleSettings as TypeSimpleStyleConfig;
    if (isLineStringVectorConfig(settings)) {
      const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
      return new Style({ stroke: new Stroke(strokeOptions) });
    }
    return undefined;
  }

  private processSolidFill(settings: TypePolygonVectorConfig): Style | undefined {
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0.25);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
    });
  }

  private processNullFill(settings: TypePolygonVectorConfig): Style | undefined {
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);
    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
    });
  }

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

  private processPaternFill(settings: TypePolygonVectorConfig, fillPaternLines: FillPaternLine[]): Style | undefined {
    const paternSize = settings.paternSize !== undefined ? settings.paternSize : 8;
    if (settings.color === undefined) settings.color = this.getDefaultColorAndIncrementIndex(0.25);
    const fillOptions: FillOptions = { color: settings.color };
    const strokeOptions: StrokeOptions = this.createStrokeOptions(settings);

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

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = paternSize;
    outputCanvas.height = paternSize;
    const outputContext = outputCanvas.getContext('2d');
    outputContext!.putImageData(context!.getImageData(paternSize / 2, paternSize / 2, paternSize, paternSize), 0, 0);

    fillOptions.color = outputContext!.createPattern(outputCanvas, 'repeat');
    return new Style({
      stroke: new Stroke(strokeOptions),
      fill: new Fill(fillOptions),
    });
  }

  private processBackwardDiagonalFill(settings: TypePolygonVectorConfig): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.backwardDiagonal);
  }

  private processForwardDiagonalFill(settings: TypePolygonVectorConfig): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.forwardDiagonal);
  }

  private processCrossFill(settings: TypePolygonVectorConfig): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.cross);
  }

  private processDiagonalCrossFill(settings: TypePolygonVectorConfig): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.diagonalCross);
  }

  private processHorizontalFill(settings: TypePolygonVectorConfig): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.horizontal);
  }

  private processVerticalFill(settings: TypePolygonVectorConfig): Style | undefined {
    return this.processPaternFill(settings, this.fillPaternSettings.vertical);
  }

  private processSimplePolygon(
    styleSettings: TypeStyleSettings | TypeKindOfVectorSettings,
    feature: FeatureLike
  ): Style | undefined {
    const { settings } = styleSettings as TypeSimpleStyleConfig;
    if (isFilledPolygonVectorConfig(settings)) {
      const { fillStyle } = settings;
      return this.processFillStyle[fillStyle].call(this, settings);
    }
    return undefined;
  }

  private searchUniqueValueEntry(
    fields: string[],
    uniqueValueStyleInfo: TypeUniqueValueStyleInfo[],
    feature: FeatureLike
  ): number | undefined {
    for (let i = 0; i < uniqueValueStyleInfo.length; i++) {
      for (let j = 0; j < fields.length; j++) {
        // eslint-disable-next-line eqeqeq
        if (feature.get(fields[j]) == uniqueValueStyleInfo[i].values[j] && j + 1 === fields.length) return i;
      }
    }
    return undefined;
  }

  private processUniqueValuePoint(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
      if (i !== undefined) return this.processSimplePoint(uniqueValueStyleInfo[i].settings, feature);
      if (defaultSettings !== undefined) return this.processSimplePoint(defaultSettings, feature);
    }
    return undefined;
  }

  private processUniqueLineString(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
      if (i !== undefined) return this.processSimpleLineString(uniqueValueStyleInfo[i].settings, feature);
      if (defaultSettings !== undefined) return this.processSimpleLineString(defaultSettings, feature);
    }
    return undefined;
  }

  private processUniquePolygon(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isUniqueValueStyleConfig(styleSettings)) {
      const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings;
      const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
      if (i !== undefined) return this.processSimplePolygon(uniqueValueStyleInfo[i].settings, feature);
      if (defaultSettings !== undefined) return this.processSimplePolygon(defaultSettings, feature);
    }
    return undefined;
  }

  private searchClassBreakEntry(field: string, classBreakStyleInfos: TypeClassBreakStyleInfo[], feature: FeatureLike): number | undefined {
    const fieldValue = feature.get(field) as number;
    if (fieldValue >= classBreakStyleInfos[0].minValue! && fieldValue <= classBreakStyleInfos[0].maxValue) return 0;

    for (let i = 1; i < classBreakStyleInfos.length; i++) {
      if (fieldValue > classBreakStyleInfos[i].minValue! && fieldValue <= classBreakStyleInfos[i].maxValue) return i;
    }
    return undefined;
  }

  private processClassBreaksPoint(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfos } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfos, feature);
      if (i !== undefined) return this.processSimplePoint(classBreakStyleInfos[i].settings, feature);
      if (defaultSettings !== undefined) return this.processSimplePoint(defaultSettings, feature);
    }
    return undefined;
  }

  private processClassBreaksLineString(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfos } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfos, feature);
      if (i !== undefined) return this.processSimpleLineString(classBreakStyleInfos[i].settings, feature);
      if (defaultSettings !== undefined) return this.processSimpleLineString(defaultSettings, feature);
    }
    return undefined;
  }

  private processClassBreaksPolygon(styleSettings: TypeStyleSettings | TypeKindOfVectorSettings, feature: FeatureLike): Style | undefined {
    if (isClassBreakStyleConfig(styleSettings)) {
      const { defaultSettings, field, classBreakStyleInfos } = styleSettings;
      const i = this.searchClassBreakEntry(field, classBreakStyleInfos, feature);
      if (i !== undefined) return this.processSimplePolygon(classBreakStyleInfos[i].settings, feature);
      if (defaultSettings !== undefined) return this.processSimplePolygon(defaultSettings, feature);
    }
    return undefined;
  }

  private createDefaultStyle(
    geometryType: TypeStyleConfigKey,
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
