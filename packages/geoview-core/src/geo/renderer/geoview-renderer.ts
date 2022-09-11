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
  isUniqueValueStyleConfig,
  TypeBaseStyleType,
  TypeFillStyle,
  TypePolygonVectorConfig,
  TypeIconSymbolVectorConfig,
  TypeKinfOfSymbolVectorSettings,
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
  TypeBaseVectorLayerEntryConfig,
} from '../map/map-schema-types';
import { defaultColor } from './geoview-renderer-types';

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
    Record<TypeStyleConfigKey, (styleSettings: TypeStyleSettings, feature: FeatureLike) => Style | undefined>
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
    classBreak: {
      Point: this.styleNotImplemented,
      LineString: this.styleNotImplemented,
      Polygon: this.styleNotImplemented,
    },
  };

  private processSymbol: Record<TypeSymbol, (settings: TypeSimpleSymbolVectorConfig) => Style | undefined> = {
    circle: this.processCircleSymbol,
    '+': this.symbolNotImplemented,
    diamond: this.processDiamondSymbol,
    square: this.processSquareSymbol,
    triangle: this.processTriangleSymbol,
    X: this.symbolNotImplemented,
  };

  private processFillStyle: Record<TypeFillStyle, (settings: TypePolygonVectorConfig) => Style | undefined> = {
    solid: this.processSolidFill,
  };

  constructor(mapId: string) {
    this.mapId = mapId;
    this.defaultColorIndex = 0;
  }

  getStyle(
    feature: FeatureLike,
    layerEntry: TypeBaseVectorLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig
  ): Style | undefined {
    const geometryType = feature.getGeometry()?.getType() as TypeStyleConfigKey;
    // If style does not exist for the geometryType, create it.
    const { style } = layerEntry as TypeVectorLayerEntryConfig;
    if (style === undefined || style[geometryType] === undefined)
      this.createDefaultStyle(geometryType, layerEntry as TypeVectorLayerEntryConfig);
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

  private styleNotImplemented(styleSettings: TypeStyleSettings, feature: FeatureLike): Style | undefined {
    // eslint-disable-next-line no-console
    console.log('Style processing function is not implemented.');
    return undefined;
  }

  private symbolNotImplemented(settings: TypeSimpleSymbolVectorConfig): Style | undefined {
    // eslint-disable-next-line no-console
    console.log('Style processing function is not implemented.');
    return undefined;
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

  private processSimplePoint(styleSettings: TypeStyleSettings | TypeUniqueValueStyleInfo, feature: FeatureLike): Style | undefined {
    const { settings } = styleSettings as TypeSimpleStyleConfig | TypeUniqueValueStyleInfo;
    if (isSimpleSymbolVectorConfig(settings)) {
      const { symbol } = settings;
      return this.processSymbol[symbol].call(this, settings);
    }
    if (isIconSymbolVectorConfig(settings)) return this.processIconSymbol(settings);
    return undefined;
  }

  private processSimpleLineString(styleSettings: TypeStyleSettings | TypeUniqueValueStyleInfo, feature: FeatureLike): Style | undefined {
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

  private processSimplePolygon(styleSettings: TypeStyleSettings | TypeUniqueValueStyleInfo, feature: FeatureLike): Style | undefined {
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
    let i = 0;
    let matchFound = false;
    for (i = 0; i < uniqueValueStyleInfo.length && !matchFound; i++) {
      matchFound = true;
      for (let j = 0; j < fields.length && matchFound; j++) {
        if (feature.get(fields[j]) !== uniqueValueStyleInfo[i].values[j]) matchFound = false;
      }
    }
    if (matchFound) return --i; // correction to the indexbecause it points to the next entry.
    return undefined;
  }

  private processUniqueValuePoint(styleSettings: TypeStyleSettings, feature: FeatureLike): Style | undefined {
    const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings as TypeUniqueValueStyleConfig;
    const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
    if (i !== undefined) return this.processSimplePoint(uniqueValueStyleInfo[i], feature);
    if (defaultSettings !== undefined) return this.processSimplePoint(styleSettings, feature);
    return undefined;
  }

  private processUniqueLineString(styleSettings: TypeStyleSettings, feature: FeatureLike): Style | undefined {
    const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings as TypeUniqueValueStyleConfig;
    const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
    if (i !== undefined) return this.processSimpleLineString(uniqueValueStyleInfo[i], feature);
    if (defaultSettings !== undefined) return this.processSimplePoint(styleSettings, feature);
    return undefined;
  }

  private processUniquePolygon(styleSettings: TypeStyleSettings, feature: FeatureLike): Style | undefined {
    const { defaultSettings, fields, uniqueValueStyleInfo } = styleSettings as TypeUniqueValueStyleConfig;
    const i = this.searchUniqueValueEntry(fields, uniqueValueStyleInfo, feature);
    if (i !== undefined) return this.processSimplePolygon(uniqueValueStyleInfo[i], feature);
    if (defaultSettings !== undefined) return this.processSimplePoint(styleSettings, feature);
    return undefined;
  }

  private createDefaultStyle(geometryType: TypeStyleConfigKey, layerEntry: TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig) {
    if (layerEntry.style === undefined) layerEntry.style = {};
    const id = `${this.mapId}-${layerEntry.geoviewRootLayer?.layerId}-${layerEntry.layerId}`;
    let label = getLocalizedValue(layerEntry.layerName, this.mapId);
    label = label !== undefined ? label : id;
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
      const styleSettings: TypeSimpleStyleConfig = { id, styleType: 'simple', label, settings };
      layerEntry.style[geometryType] = styleSettings;
      this.incrementDefaultColorIndex();
      return;
    }
    if (geometryType === 'LineString') {
      const settings: TypeLineStringVectorConfig = {
        type: 'lineString',
        stroke: { color: this.getDefaultColor(1) },
      };
      const styleSettings: TypeSimpleStyleConfig = { id, styleType: 'simple', label, settings };
      layerEntry.style[geometryType] = styleSettings;
      this.incrementDefaultColorIndex();
      return;
    }
    if (geometryType === 'Polygon') {
      const settings: TypePolygonVectorConfig = {
        type: 'filledPolygon',
        color: this.getDefaultColor(0.25),
        stroke: { color: this.getDefaultColor(1) },
        fillStyle: 'solid',
      };
      const styleSettings: TypeSimpleStyleConfig = { id, styleType: 'simple', label, settings };
      layerEntry.style[geometryType] = styleSettings;
      this.incrementDefaultColorIndex();
      return;
    }
    // eslint-disable-next-line no-console
    console.log(`Geometry type ${geometryType} is not supported by the GeoView viewer.`);
  }
}
