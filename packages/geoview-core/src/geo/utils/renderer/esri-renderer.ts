import { asString } from 'ol/color';

import type {
  TypeKindOfVectorSettings,
  TypeFillStyle,
  TypePolygonVectorConfig,
  TypeIconSymbolVectorConfig,
  TypeLineStyle,
  TypeLineStringVectorConfig,
  TypeSimpleSymbolVectorConfig,
  TypeLayerStyleConfig,
  TypeLayerStyleConfigInfo,
  TypeLayerStyleSettings,
  TypeStyleGeometry,
  TypeSymbol,
} from '@/api/types/map-schema-types';
import {
  isFilledPolygonVectorConfig,
  isIconSymbolVectorConfig,
  isLineStringVectorConfig,
  isSimpleSymbolVectorConfig,
} from '@/api/types/map-schema-types';

import { logger } from '@/core/utils/logger';

/*
 * This file contains a partial implementation of the ESRI renderer types.
 */
export class EsriRenderer {
  /**
   * type guard function that redefines an EsriBaseRenderer as an EsriUniqueValueRenderer if the type attribute of the
   * verifyIfRenderer parameter is 'uniqueValue'. The type ascention applies only to the true block of the if clause that use
   * this function.
   *
   * @param {EsriBaseRenderer} verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid.
   *
   * @returns {boolean} true if the type ascention is valid.
   */
  static esriRendererIsUniqueValue = (verifyIfRenderer: EsriBaseRenderer): verifyIfRenderer is EsriUniqueValueRenderer => {
    return verifyIfRenderer?.type === 'uniqueValue';
  };

  /**
   * type guard function that redefines an EsriBaseSymbol as an EsriSimpleMarkerSymbol if the type attribute of the verifyIfSymbol
   * parameter is 'esriSMS'. The type ascention applies only to the true block of the if clause that use this function.
   *
   * @param {EsriBaseSymbol} verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid.
   *
   * @returns {boolean} true if the type ascention is valid.
   */
  static isSimpleMarkerSymbol = (verifyIfSymbol: EsriBaseSymbol): verifyIfSymbol is EsriSimpleMarkerSymbol => {
    return verifyIfSymbol?.type === 'esriSMS';
  };

  /**
   * type guard function that redefines an EsriBaseSymbol as an EsriSimpleFillSymbol if the type attribute of the verifyIfSymbol
   * parameter is 'esriSFS'. The type ascention applies only to the true block of the if clause that use this function.
   *
   * @param {EsriBaseSymbol} verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid.
   *
   * @returns {boolean} true if the type ascention is valid.
   */
  static isEsriSimpleFillSymbol = (verifyIfSymbol: EsriBaseSymbol): verifyIfSymbol is EsriSimpleFillSymbol => {
    return verifyIfSymbol?.type === 'esriSFS';
  };

  /**
   * type guard function that redefines an EsriBaseSymbol as an EsriSimpleLineSymbol if the type attribute of the verifyIfSymbol
   * parameter is 'esriSLS'. The type ascention applies only to the true block of the if clause that use this function.
   *
   * @param {EsriBaseSymbol} verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid.
   *
   * @returns {boolean} true if the type ascention is valid.
   */
  static isSimpleLineSymbol = (verifyIfSymbol: EsriBaseSymbol): verifyIfSymbol is EsriSimpleLineSymbol => {
    return verifyIfSymbol?.type === 'esriSLS';
  };

  /**
   * type guard function that redefines an EsriBaseSymbol as an EsriPictureMarkerSymbol if the type attribute of the verifyIfSymbol
   * parameter is 'esriPMS'. The type ascention applies only to the true block of the if clause that use this function.
   *
   * @param {EsriBaseSymbol} verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid.
   *
   * @returns {boolean} true if the type ascention is valid.
   */
  static isPictureMarkerSymbol = (verifyIfSymbol: EsriBaseSymbol): verifyIfSymbol is EsriPictureMarkerSymbol => {
    return verifyIfSymbol?.type === 'esriPMS';
  };

  /**
   * type guard function that redefines an EsriBaseRenderer as an EsriSimpleRenderer if the type attribute of the verifyIfRenderer
   * parameter is 'simple'. The type ascention applies only to the true block of the if clause that use this function.
   *
   * @param {EsriBaseRenderer} verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid.
   *
   * @returns {boolean} true if the type ascention is valid.
   */
  static esriRendererIsSimple = (verifyIfRenderer: EsriBaseRenderer): verifyIfRenderer is EsriSimpleRenderer => {
    return verifyIfRenderer?.type === 'simple';
  };

  /**
   * type guard function that redefines an EsriBaseRenderer as an EsriClassBreakRenderer if the type attribute of the
   * verifyIfRenderer parameter is 'classBreaks'. The type ascention applies only to the true block of the if clause that use this
   * function.
   *
   * @param {EsriBaseRenderer} verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid.
   *
   * @returns {boolean} true if the type ascention is valid.
   */
  static esriRendererIsClassBreaks = (verifyIfRenderer: EsriBaseRenderer): verifyIfRenderer is EsriClassBreakRenderer => {
    return verifyIfRenderer?.type === 'classBreaks';
  };
  // #endregion CHECK "IS" FUNCTIONS

  // #region CONVERSION FUNCTIONS
  /**
   * Convert the ESRI line style to the GeoView line style.
   *
   * @param {EsriLineStyle} lineStyle - ESRI line style to convert.
   *
   * @returns {TypeLineStyle} The Geoview line style associated to the ESRI line style.
   */
  static convertLineStyle(lineStyle: EsriLineStyle): TypeLineStyle {
    switch (lineStyle) {
      case 'esriSLSDash':
        return 'dash';
      case 'esriSLSDashDot':
        return 'dash-dot';
      case 'esriSLSDashDotDot':
        return 'dash-dot-dot';
      case 'esriSLSDot':
        return 'dot';
      case 'esriSLSLongDash':
        return 'longDash';
      case 'esriSLSLongDashDot':
        return 'longDash-dot';
      case 'esriSLSNull':
        return 'null';
      case 'esriSLSShortDash':
        return 'shortDash';
      case 'esriSLSShortDashDot':
        return 'shortDash-dot';
      case 'esriSLSShortDashDotDot':
        return 'shortDash-dot-dot';
      case 'esriSLSSolid':
      case null:
      case undefined:
        return 'solid';
      default: {
        logger.logInfo(`Handling of ESRI renderer line style '${lineStyle}' is not coded, 'solid' will be used instead.`);
        return 'solid';
      }
    }
  }

  /**
   * Convert the ESRI fill style to the GeoView fill style.
   *
   * @param {EsriFillStyle} fillStyle - ESRI fill style to convert.
   *
   * @returns {TypeFillStyle} The Geoview fill style associated to the ESRI fill style.
   */
  static convertFillStyle(fillStyle: EsriFillStyle): TypeFillStyle {
    switch (fillStyle) {
      case 'esriSFSBackwardDiagonal':
        return 'backwardDiagonal';
      case 'esriSFSCross':
        return 'cross';
      case 'esriSFSDiagonalCross':
        return 'diagonalCross';
      case 'esriSFSForwardDiagonal':
        return 'forwardDiagonal';
      case 'esriSFSHorizontal':
        return 'horizontal';
      case 'esriSFSNull':
        return 'solid';
      case 'esriSFSSolid':
        return 'solid';
      case 'esriSFSVertical':
        return 'vertical';
      default: {
        logger.logInfo(`Handling of ESRI renderer fill style '${fillStyle}' is not coded, 'solid' will be used instead.`);
        return 'solid';
      }
    }
  }

  /**
   * Convert the ESRI symbol style to the GeoView symbol style.
   *
   * @param {EsriSymbolStyle} symbolStyle - ESRI symbol style to convert.
   *
   * @returns {TypeSymbol} The Geoview symbol style associated to the ESRI symbol style.
   */
  static convertSymbolStyle(symbolStyle: EsriSymbolStyle): TypeSymbol {
    switch (symbolStyle) {
      case 'esriSMSCircle':
        return 'circle';
      case 'esriSMSCross':
        return '+';
      case 'esriSMSDiamond':
        return 'diamond';
      case 'esriSMSSquare':
        return 'square';
      case 'esriSMSTriangle':
        return 'triangle';
      case 'esriSMSX':
        return 'X';
      default: {
        logger.logInfo(`Handling of ESRI renderer symbol style '${symbolStyle}' is not coded, 'circle' will be used instead.`);
        return 'circle';
      }
    }
  }

  /**
   * Convert an ESRI color to a GeoView color.
   *
   * @param {TypeEsriColor} color - ESRI color to convert.
   *
   * @returns {string} The Geoview color corresponding to the ESRI color.
   */
  static convertEsriColor(color: TypeEsriColor): string {
    if (color) return asString([color[0], color[1], color[2], color[3] / 255]);
    return 'rgba(0,0,0,0)';
  }

  /**
   * Convert an ESRI symbol to a GeoView symbol.
   *
   * @param {EsriSymbol} symbol - ESRI symbol to convert.
   *
   * @returns {TypeKindOfVectorSettings | undefined} The Geoview symbol corresponding to the ESRI symbol or undefined if
   * ESRI symbol is not handled.
   */
  static convertSymbol(symbol: EsriSymbol): TypeKindOfVectorSettings | undefined {
    if (symbol) {
      if (this.isSimpleMarkerSymbol(symbol)) {
        const offset: [number, number] = [
          symbol.xoffset !== undefined ? symbol.xoffset : 0,
          symbol.yoffset !== undefined ? symbol.yoffset : 0,
        ];
        const simpleSymbolVectorConfig: TypeSimpleSymbolVectorConfig = {
          type: 'simpleSymbol',
          rotation: symbol.angle !== undefined ? symbol.angle : 0,
          color: this.convertEsriColor(symbol?.color),
          stroke: {
            color: this.convertEsriColor(symbol?.outline?.color),
            lineStyle: this.convertLineStyle(symbol?.outline?.style),
            width: symbol?.outline?.width ?? 0,
          },
          size: symbol.size * 0.667,
          symbol: this.convertSymbolStyle(symbol.style),
          offset,
        };
        return simpleSymbolVectorConfig;
      }
      if (this.isSimpleLineSymbol(symbol)) {
        const lineSymbolVectorConfig: TypeLineStringVectorConfig = {
          type: 'lineString',
          stroke: {
            color: this.convertEsriColor(symbol?.color),
            lineStyle: this.convertLineStyle(symbol?.style),
            width: symbol?.width ?? 0,
          },
        };
        return lineSymbolVectorConfig;
      }
      if (this.isEsriSimpleFillSymbol(symbol)) {
        const polygonVectorConfig: TypePolygonVectorConfig = {
          type: 'filledPolygon',
          color: this.convertEsriColor(symbol?.color),
          stroke: {
            color: this.convertEsriColor(symbol?.outline?.color),
            lineStyle: this.convertLineStyle(symbol?.outline?.style),
            width: symbol?.outline?.width ?? 0,
          },
          fillStyle: this.convertFillStyle(symbol.style),
        };
        return polygonVectorConfig;
      }
      if (this.isPictureMarkerSymbol(symbol)) {
        const offset: [number, number] = [
          symbol.xoffset !== undefined ? symbol.xoffset : 0,
          symbol.yoffset !== undefined ? symbol.yoffset : 0,
        ];
        const iconSymbolVectorConfig: TypeIconSymbolVectorConfig = {
          type: 'iconSymbol',
          mimeType: symbol.contentType,
          src: symbol.imageData,
          rotation: symbol.angle !== undefined ? symbol.angle : 0,
          opacity: 1,
          offset,
        };
        return iconSymbolVectorConfig;
      }
      logger.logInfo(`Handling of ESRI renderer symbol '${symbol}' is not coded, default GeoView settings will be used instead.`);
    }
    return undefined;
  }
  // #endregion CONVERSION FUNCTIONS

  /**
   * Get the configuration key of the style.
   *
   * @param {TypeKindOfVectorSettings} settings - GeoView settings.
   *
   * @returns {TypeStyleGeometry | undefined} The Geoview style key or undefined if it can not be determined.
   */
  static getStyleGeometry(settings: TypeKindOfVectorSettings): TypeStyleGeometry | undefined {
    if (isIconSymbolVectorConfig(settings) || isSimpleSymbolVectorConfig(settings)) return 'Point';
    if (isFilledPolygonVectorConfig(settings)) return 'Polygon';
    if (isLineStringVectorConfig(settings)) return 'LineString';
    return undefined;
  }

  /**
   * Process ESRI unique value renderer and convert it to a GeoView style.
   *
   * @param {EsriUniqueValueRenderer} renderer - ESRI renderer to convert.
   *
   * @returns {TypeLayerStyleConfig | undefined} The Geoview style or undefined if it can not be created.
   */
  static processUniqueValueRenderer(renderer: EsriUniqueValueRenderer): TypeLayerStyleConfig | undefined {
    const style: TypeLayerStyleConfig = {};
    const fields = [];
    if (renderer.field1) fields.push(renderer.field1);
    if (renderer.field2) fields.push(renderer.field2);
    if (renderer.field3) fields.push(renderer.field3);

    const uniqueValueStyleInfo: TypeLayerStyleConfigInfo[] = [];
    renderer.uniqueValueInfos.forEach((symbolInfo) => {
      const settings = this.convertSymbol(symbolInfo.symbol);
      if (settings) {
        if (renderer.rotationType === 'geographic' && (isIconSymbolVectorConfig(settings) || isSimpleSymbolVectorConfig(settings)))
          settings.rotation = Math.PI / 2 - settings.rotation!;
        uniqueValueStyleInfo.push({
          label: symbolInfo.label,
          visible: true,
          values: symbolInfo.value.replaceAll("'", "''").split(renderer.fieldDelimiter), // GV: We need to escape the ' character with double '' for ESRI
          settings,
        });
      }
    });

    // Add default setting to the end of the array
    const defaultSettings = this.convertSymbol(renderer.defaultSymbol);
    const hasDefault = !!defaultSettings;
    if (hasDefault) {
      if (
        renderer.rotationType === 'geographic' &&
        (isIconSymbolVectorConfig(defaultSettings) || isSimpleSymbolVectorConfig(defaultSettings))
      )
        defaultSettings.rotation = Math.PI / 2 - defaultSettings.rotation!;
      uniqueValueStyleInfo.push({
        label: renderer.defaultLabel,
        visible: true,
        values: [''],
        settings: defaultSettings,
      });
    }

    // If any found
    if (uniqueValueStyleInfo.length > 0) {
      const styleGeometry = this.getStyleGeometry(uniqueValueStyleInfo[0].settings);
      const styleSettings: TypeLayerStyleSettings = {
        type: 'uniqueValue',
        hasDefault: !!renderer.defaultLabel,
        fields,
        info: uniqueValueStyleInfo,
      };
      if (styleGeometry) {
        style[styleGeometry] = styleSettings;
        return style;
      }
    }
    return undefined;
  }

  /**
   * Process ESRI simple renderer and convert it to a GeoView style.
   *
   * @param {EsriSimpleRenderer} renderer - ESRI renderer to convert.
   *
   * @returns {TypeLayerStyleConfig | undefined} The Geoview style or undefined if it can not be created.
   */
  static processSimpleRenderer(renderer: EsriSimpleRenderer): TypeLayerStyleConfig | undefined {
    const style: TypeLayerStyleConfig = {};
    const { label } = renderer;
    const settings = this.convertSymbol(renderer.symbol);
    if (settings) {
      if (renderer.rotationType === 'geographic' && (isIconSymbolVectorConfig(settings) || isSimpleSymbolVectorConfig(settings)))
        settings.rotation = Math.PI / 2 - settings.rotation!;
      const styleInfo: TypeLayerStyleConfigInfo = { visible: true, label, values: [], settings };
      const styleGeometry = this.getStyleGeometry(settings);
      const styleSettings: TypeLayerStyleSettings = {
        type: 'simple',
        fields: [],
        hasDefault: false,
        info: [styleInfo],
      };
      if (styleGeometry) {
        style[styleGeometry] = styleSettings;
        return style;
      }
    }
    return undefined;
  }

  /**
   * Process ESRI class break renderer and convert it to a GeoView style.
   *
   * @param {EsriClassBreakRenderer} renderer - ESRI renderer to convert.
   *
   * @returns {TypeLayerStyleConfig | undefined} The Geoview style or undefined if it can not be created.
   */
  static processClassBreakRenderer(renderer: EsriClassBreakRenderer): TypeLayerStyleConfig | undefined {
    const { field } = renderer;
    const style: TypeLayerStyleConfig = {};
    const classBreakStyleInfo: TypeLayerStyleConfigInfo[] = [];
    for (let i = 0; i < renderer.classBreakInfos.length; i++) {
      const settings = this.convertSymbol(renderer.classBreakInfos[i].symbol);
      if (settings) {
        if (renderer.rotationType === 'geographic' && (isIconSymbolVectorConfig(settings) || isSimpleSymbolVectorConfig(settings)))
          settings.rotation = Math.PI / 2 - settings.rotation!;
        const geoviewClassBreakInfo: TypeLayerStyleConfigInfo = {
          label: renderer.classBreakInfos[i].label,
          visible: true,
          values: [renderer.classBreakInfos[i].classMinValue as number, renderer.classBreakInfos[i].classMaxValue],
          settings,
        };
        classBreakStyleInfo.push(geoviewClassBreakInfo);
        if (renderer.classBreakInfos[i].classMinValue || renderer.classBreakInfos[i].classMinValue === 0)
          classBreakStyleInfo[i].values[0] = renderer.classBreakInfos[i].classMinValue as number;
        else if (i === 0) classBreakStyleInfo[i].values[0] = renderer.minValue;
        else classBreakStyleInfo[i].values[0] = renderer.classBreakInfos[i - 1].classMaxValue;
      }
    }

    const defaultSettings = this.convertSymbol(renderer.defaultSymbol);
    const hasDefault = !!defaultSettings;
    if (hasDefault) {
      if (
        renderer.rotationType === 'geographic' &&
        (isIconSymbolVectorConfig(defaultSettings) || isSimpleSymbolVectorConfig(defaultSettings))
      )
        defaultSettings.rotation = Math.PI / 2 - defaultSettings.rotation!;
      classBreakStyleInfo.push({
        label: renderer.defaultLabel,
        visible: true,
        values: [],
        settings: defaultSettings,
      });
    }

    // If any found
    if (classBreakStyleInfo.length > 0) {
      const styleGeometry = this.getStyleGeometry(classBreakStyleInfo[0].settings);
      if (styleGeometry) {
        const styleSettings: TypeLayerStyleSettings = {
          type: 'classBreaks',
          fields: [field],
          hasDefault,
          info: classBreakStyleInfo,
        };

        style[styleGeometry] = styleSettings;
        return style;
      }
    }
    return undefined;
  }

  /**
   * Get GeoView style from Esri renderer.
   *
   * @param {EsriBaseRenderer | undefined} renderer - ESRI renderer to convert.
   *
   * @returns {TypeStyleConfig | undefined} The Geoview style or undefined if it can not be created.
   */
  static getStyleFromEsriRenderer(renderer: EsriBaseRenderer | undefined): TypeLayerStyleConfig | undefined {
    if (!renderer) return undefined;
    if (this.esriRendererIsUniqueValue(renderer)) return this.processUniqueValueRenderer(renderer);
    if (this.esriRendererIsSimple(renderer)) return this.processSimpleRenderer(renderer);
    if (this.esriRendererIsClassBreaks(renderer)) return this.processClassBreakRenderer(renderer);
    logger.logInfo(`Handling of ESRI renderer '${renderer.type}' is not coded, default GeoView settings will be used instead.`);
    return undefined;
  }

  /** *****************************************************************************************************************************
   * Parse the GeoView style using the Esri renderer.
   *
   * @param {EsriBaseRenderer} renderer - ESRI renderer to convert.
   *
   * @returns {TypeLayerStyleSettings | undefined} The Geoview style or undefined if it can not be created.
   */
  static createStyleUsingEsriRenderer(renderer: EsriBaseRenderer): TypeLayerStyleConfig | undefined {
    if (this.esriRendererIsUniqueValue(renderer)) return this.processUniqueValueRenderer(renderer);
    if (this.esriRendererIsSimple(renderer)) return this.processSimpleRenderer(renderer);
    if (this.esriRendererIsClassBreaks(renderer)) return this.processClassBreakRenderer(renderer);
    logger.logWarning(`Handling of ESRI renderer '${renderer.type}' is not coded, default GeoView settings will be used instead.`);
    return undefined;
  }
}

// #region TYPE & INTERFACE
export type EsriRendererTypes = 'uniqueValue' | 'simple' | 'classBreaks';

export type EsriBaseRenderer = {
  type: EsriRendererTypes;
};

type TypeEsriColor = [number, number, number, number];

export interface EsriUniqueValueRenderer extends EsriBaseRenderer {
  type: 'uniqueValue';
  defaultLabel: string;
  defaultSymbol: EsriSymbol;
  field1: string;
  field2: string;
  field3: string;
  fieldDelimiter: string;
  rotationType: 'arithmetic' | 'geographic';
  uniqueValueInfos: EsriUniqueValueInfo[];
}

export type EsriUniqueValueInfo = {
  description: string;
  label: string;
  symbol: EsriSymbol;
  value: string;
};

export type EsriSymbol = EsriBaseSymbol | EsriSimpleMarkerSymbol | EsriSimpleLineSymbol | EsriPictureMarkerSymbol;

export type EsriBaseSymbol = {
  type: 'esriSMS' | 'esriSLS' | 'esriPMS' | 'esriSFS';
};

export interface EsriSimpleMarkerSymbol extends EsriBaseSymbol {
  angle: number;
  color: TypeEsriColor;
  outline: EsriSimpleLineSymbol;
  size: number;
  style: EsriSymbolStyle;
  type: 'esriSMS';
  xoffset: number;
  yoffset: number;
}

export interface EsriSimpleFillSymbol extends EsriBaseSymbol {
  color: TypeEsriColor;
  outline: EsriSimpleLineSymbol;
  style: EsriFillStyle;
  type: 'esriSFS';
  width: number;
}

export type EsriFillStyle =
  | 'esriSFSBackwardDiagonal'
  | 'esriSFSCross'
  | 'esriSFSDiagonalCross'
  | 'esriSFSForwardDiagonal'
  | 'esriSFSHorizontal'
  | 'esriSFSNull'
  | 'esriSFSSolid'
  | 'esriSFSVertical';

export interface EsriSimpleLineSymbol extends EsriBaseSymbol {
  color: TypeEsriColor;
  style: EsriLineStyle;
  type: 'esriSLS';
  width: number;
}

export type EsriLineStyle =
  | 'esriSLSDash'
  | 'esriSLSDashDot'
  | 'esriSLSDashDotDot'
  | 'esriSLSDot'
  | 'esriSLSLongDash'
  | 'esriSLSLongDashDot'
  | 'esriSLSNull'
  | 'esriSLSShortDash'
  | 'esriSLSShortDashDot'
  | 'esriSLSShortDashDotDot'
  | 'esriSLSShortDot'
  | 'esriSLSSolid';

export type EsriSymbolStyle = 'esriSMSCircle' | 'esriSMSCross' | 'esriSMSDiamond' | 'esriSMSSquare' | 'esriSMSTriangle' | 'esriSMSX';

export interface EsriSimpleRenderer extends EsriBaseRenderer {
  type: 'simple';
  description: string;
  label: string;
  rotationExpression: string;
  rotationType: 'arithmetic' | 'geographic';
  symbol: EsriSymbol;
}

export interface EsriPictureMarkerSymbol extends EsriBaseSymbol {
  angle: number;
  contentType: string;
  height: number;
  imageData: string;
  type: 'esriPMS';
  width: number;
  xoffset: number;
  yoffset: number;
}

type EsriClassBreakInfoEntry = {
  classMaxValue: number;
  classMinValue: number | undefined | null;
  description: string;
  label: string;
  symbol: EsriSymbol;
};

export interface EsriClassBreakRenderer extends EsriBaseRenderer {
  type: 'classBreaks';
  classBreakInfos: EsriClassBreakInfoEntry[];
  defaultLabel: string;
  defaultSymbol: EsriSymbol;
  field: string;
  minValue: number;
  rotationExpression: string;
  rotationType: 'arithmetic' | 'geographic';
}
// #endregion TYPE & INTERFACE
