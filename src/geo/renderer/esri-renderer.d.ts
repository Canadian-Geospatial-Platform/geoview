import { TypeStyleConfig, TypeLayerEntryConfig } from '../map/map-schema-types';
export type EsriRendererTypes = 'uniqueValue' | 'simple' | 'classBreaks';
export type EsriBaseRenderer = {
    type: EsriRendererTypes;
};
type TypeEsriColor = [number, number, number, number];
/** *****************************************************************************************************************************
 * type guard function that redefines an EsriBaseRenderer as an EsriUniqueValueRenderer if the type attribute of the
 * verifyIfRenderer parameter is 'uniqueValue'. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {EsriBaseRenderer} verifyIfRenderer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const esriRendererIsUniqueValue: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriUniqueValueRenderer;
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
/** *****************************************************************************************************************************
 * type guard function that redefines an EsriBaseSymbol as an EsriSimpleMarkerSymbol if the type attribute of the verifyIfSymbol
 * parameter is 'esriSMS'. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {EsriBaseSymbol} verifyIfSymbol Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const isSimpleMarkerSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleMarkerSymbol;
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
/** *****************************************************************************************************************************
 * type guard function that redefines an EsriBaseSymbol as an EsriSimpleFillSymbol if the type attribute of the verifyIfSymbol
 * parameter is 'esriSFS'. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {EsriBaseSymbol} verifyIfSymbol Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const isEsriSimpleFillSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleFillSymbol;
export interface EsriSimpleFillSymbol extends EsriBaseSymbol {
    color: TypeEsriColor;
    outline: EsriSimpleLineSymbol;
    style: EsriFillStyle;
    type: 'esriSFS';
    width: number;
}
export type EsriFillStyle = 'esriSFSBackwardDiagonal' | 'esriSFSCross' | 'esriSFSDiagonalCross' | 'esriSFSForwardDiagonal' | 'esriSFSHorizontal' | 'esriSFSNull' | 'esriSFSSolid' | 'esriSFSVertical';
/** *****************************************************************************************************************************
 * type guard function that redefines an EsriBaseSymbol as an EsriSimpleLineSymbol if the type attribute of the verifyIfSymbol
 * parameter is 'esriSLS'. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {EsriBaseSymbol} verifyIfSymbol Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const isSimpleLineSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleLineSymbol;
export interface EsriSimpleLineSymbol extends EsriBaseSymbol {
    color: TypeEsriColor;
    style: EsriLineStyle;
    type: 'esriSLS';
    width: number;
}
export type EsriLineStyle = 'esriSLSDash' | 'esriSLSDashDot' | 'esriSLSDashDotDot' | 'esriSLSDot' | 'esriSLSLongDash' | 'esriSLSLongDashDot' | 'esriSLSNull' | 'esriSLSShortDash' | 'esriSLSShortDashDot' | 'esriSLSShortDashDotDot' | 'esriSLSShortDot' | 'esriSLSSolid';
export type EsriSymbolStyle = 'esriSMSCircle' | 'esriSMSCross' | 'esriSMSDiamond' | 'esriSMSSquare' | 'esriSMSTriangle' | 'esriSMSX';
/** *****************************************************************************************************************************
 * type guard function that redefines an EsriBaseSymbol as an EsriPictureMarkerSymbol if the type attribute of the verifyIfSymbol
 * parameter is 'esriPMS'. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {EsriBaseSymbol} verifyIfSymbol Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const isPictureMarkerSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriPictureMarkerSymbol;
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
/** *****************************************************************************************************************************
 * type guard function that redefines an EsriBaseRenderer as an EsriSimpleRenderer if the type attribute of the verifyIfRenderer
 * parameter is 'simple'. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {EsriBaseRenderer} verifyIfRenderer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const esriRendererIsSimple: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriSimpleRenderer;
export interface EsriSimpleRenderer extends EsriBaseRenderer {
    type: 'simple';
    description: string;
    label: string;
    rotationExpression: string;
    rotationType: 'arithmetic' | 'geographic';
    symbol: EsriSymbol;
}
/** *****************************************************************************************************************************
 * type guard function that redefines an EsriBaseRenderer as an EsriClassBreakRenderer if the type attribute of the
 * verifyIfRenderer parameter is 'classBreaks'. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {EsriBaseRenderer} verifyIfRenderer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const esriRendererIsClassBreaks: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriClassBreakRenderer;
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
/** *****************************************************************************************************************************
 * Get GeoView style from Esri renderer.
 *
 * @param {string} mapId The map identifier of the ESRI layer.
 * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration object.
 * @param {EsriBaseRenderer} renderer The ESRI renderer to convert.
 *
 * @returns {TypeStyleConfig | undefined} The Geoview style or undefined if it can not be created.
 */
export declare function getStyleFromEsriRenderer(mapId: string, layerEntryConfig: TypeLayerEntryConfig, renderer: EsriBaseRenderer): TypeStyleConfig | undefined;
export {};
