import type { TypeKindOfVectorSettings, TypeFillStyle, TypeLineStyle, TypeLayerStyleConfig, TypeStyleGeometry, TypeSymbol, TypeLayerStyleVisualVariable } from '@/api/types/map-schema-types';
export declare abstract class EsriRenderer {
    #private;
    /**
     * Creates the GeoView style from the provided Esri renderer.
     * @param {EsriBaseRenderer | undefined} renderer - ESRI renderer to convert.
     * @returns {TypeStyleConfig | undefined} The Geoview style or undefined if it can not be created.
     */
    static createStylesFromEsriRenderer(renderer: EsriBaseRenderer | undefined): TypeLayerStyleConfig | undefined;
    /**
     * type guard function that redefines an EsriBaseRenderer as an EsriUniqueValueRenderer if the type attribute of the
     * verifyIfRenderer parameter is 'uniqueValue'. The type ascention applies only to the true block of the if clause that use
     * this function.
     *
     * @param {EsriBaseRenderer} verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid.
     *
     * @returns {boolean} true if the type ascention is valid.
     * @static
     */
    static esriRendererIsUniqueValue: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriUniqueValueRenderer;
    /**
     * type guard function that redefines an EsriBaseSymbol as an EsriSimpleMarkerSymbol if the type attribute of the verifyIfSymbol
     * parameter is 'esriSMS'. The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param {EsriBaseSymbol} verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid.
     *
     * @returns {boolean} true if the type ascention is valid.
     * @static
     */
    static isSimpleMarkerSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleMarkerSymbol;
    /**
     * type guard function that redefines an EsriBaseSymbol as an EsriSimpleFillSymbol if the type attribute of the verifyIfSymbol
     * parameter is 'esriSFS'. The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param {EsriBaseSymbol} verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid.
     *
     * @returns {boolean} true if the type ascention is valid.
     * @static
     */
    static isEsriSimpleFillSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleFillSymbol;
    /**
     * type guard function that redefines an EsriBaseSymbol as an EsriSimpleLineSymbol if the type attribute of the verifyIfSymbol
     * parameter is 'esriSLS'. The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param {EsriBaseSymbol} verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid.
     *
     * @returns {boolean} true if the type ascention is valid.
     * @static
     */
    static isSimpleLineSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleLineSymbol;
    /**
     * type guard function that redefines an EsriBaseSymbol as an EsriPictureMarkerSymbol if the type attribute of the verifyIfSymbol
     * parameter is 'esriPMS'. The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param {EsriBaseSymbol} verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid.
     *
     * @returns {boolean} true if the type ascention is valid.
     * @static
     */
    static isPictureMarkerSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriPictureMarkerSymbol;
    /**
     * type guard function that redefines an EsriBaseRenderer as an EsriSimpleRenderer if the type attribute of the verifyIfRenderer
     * parameter is 'simple'. The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param {EsriBaseRenderer} verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid.
     *
     * @returns {boolean} true if the type ascention is valid.
     * @static
     */
    static esriRendererIsSimple: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriSimpleRenderer;
    /**
     * type guard function that redefines an EsriBaseRenderer as an EsriClassBreakRenderer if the type attribute of the
     * verifyIfRenderer parameter is 'classBreaks'. The type ascention applies only to the true block of the if clause that use this
     * function.
     *
     * @param {EsriBaseRenderer} verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid.
     *
     * @returns {boolean} true if the type ascention is valid.
     * @static
     */
    static esriRendererIsClassBreaks: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriClassBreakRenderer;
    /**
     * Convert the ESRI line style to the GeoView line style.
     *
     * @param {EsriLineStyle} lineStyle - ESRI line style to convert.
     *
     * @returns {TypeLineStyle} The Geoview line style associated to the ESRI line style.
     * @static
     */
    static convertLineStyle(lineStyle: EsriLineStyle): TypeLineStyle;
    /**
     * Convert the ESRI fill style to the GeoView fill style.
     *
     * @param {EsriFillStyle} fillStyle - ESRI fill style to convert.
     *
     * @returns {TypeFillStyle} The Geoview fill style associated to the ESRI fill style.
     * @static
     */
    static convertFillStyle(fillStyle: EsriFillStyle): TypeFillStyle;
    /**
     * Convert the ESRI symbol style to the GeoView symbol style.
     *
     * @param {EsriSymbolStyle} symbolStyle - ESRI symbol style to convert.
     *
     * @returns {TypeSymbol} The Geoview symbol style associated to the ESRI symbol style.
     * @static
     */
    static convertSymbolStyle(symbolStyle: EsriSymbolStyle): TypeSymbol;
    /**
     * Convert an ESRI color to a GeoView color.
     *
     * @param {TypeEsriColor} color - ESRI color to convert.
     *
     * @returns {string} The Geoview color corresponding to the ESRI color.
     * @static
     */
    static convertEsriColor(color: TypeEsriColor): string;
    /**
     * Convert an ESRI symbol to a GeoView symbol.
     *
     * @param {EsriSymbol} symbol - ESRI symbol to convert.
     *
     * @returns {TypeKindOfVectorSettings | undefined} The Geoview symbol corresponding to the ESRI symbol or undefined if
     * ESRI symbol is not handled.
     * @static
     */
    static convertSymbol(symbol: EsriSymbol): TypeKindOfVectorSettings | undefined;
    /**
     * Get the configuration key of the style.
     *
     * @param {TypeKindOfVectorSettings} settings - GeoView settings.
     *
     * @returns {TypeStyleGeometry | undefined} The Geoview style key or undefined if it can not be determined.
     * @static
     */
    static getStyleGeometry(settings: TypeKindOfVectorSettings): TypeStyleGeometry | undefined;
}
export type EsriRendererTypes = 'uniqueValue' | 'simple' | 'classBreaks';
export type EsriBaseRenderer = {
    type: EsriRendererTypes;
    visualVariables?: TypeLayerStyleVisualVariable[];
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
export type EsriFillStyle = 'esriSFSBackwardDiagonal' | 'esriSFSCross' | 'esriSFSDiagonalCross' | 'esriSFSForwardDiagonal' | 'esriSFSHorizontal' | 'esriSFSNull' | 'esriSFSSolid' | 'esriSFSVertical';
export interface EsriSimpleLineSymbol extends EsriBaseSymbol {
    color: TypeEsriColor;
    style: EsriLineStyle;
    type: 'esriSLS';
    width: number;
}
export type EsriLineStyle = 'esriSLSDash' | 'esriSLSDashDot' | 'esriSLSDashDotDot' | 'esriSLSDot' | 'esriSLSLongDash' | 'esriSLSLongDashDot' | 'esriSLSNull' | 'esriSLSShortDash' | 'esriSLSShortDashDot' | 'esriSLSShortDashDotDot' | 'esriSLSShortDot' | 'esriSLSSolid';
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
export {};
//# sourceMappingURL=esri-renderer.d.ts.map