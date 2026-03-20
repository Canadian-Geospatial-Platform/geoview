import type { TypeKindOfVectorSettings, TypeFillStyle, TypeLineStyle, TypeLayerStyleConfig, TypeStyleGeometry, TypeSymbol, TypeLayerStyleVisualVariable } from '@/api/types/map-schema-types';
export declare abstract class EsriRenderer {
    #private;
    /**
     * Creates the GeoView style from the provided Esri renderer.
     *
     * @param renderer - ESRI renderer to convert
     * @returns The Geoview style, or undefined if it can not be created
     */
    static createStylesFromEsriRenderer(renderer: EsriBaseRenderer | undefined): TypeLayerStyleConfig | undefined;
    /**
     * Type guard function that redefines an EsriBaseRenderer as an EsriUniqueValueRenderer.
     *
     * The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid
     * @returns True if the type ascention is valid
     */
    static esriRendererIsUniqueValue: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriUniqueValueRenderer;
    /**
     * Type guard function that redefines an EsriBaseSymbol as an EsriSimpleMarkerSymbol.
     *
     * The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid
     * @returns True if the type ascention is valid
     */
    static isSimpleMarkerSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleMarkerSymbol;
    /**
     * Type guard function that redefines an EsriBaseSymbol as an EsriSimpleFillSymbol.
     *
     * The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid
     * @returns True if the type ascention is valid
     */
    static isEsriSimpleFillSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleFillSymbol;
    /**
     * Type guard function that redefines an EsriBaseSymbol as an EsriSimpleLineSymbol.
     *
     * The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid
     * @returns True if the type ascention is valid
     */
    static isSimpleLineSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriSimpleLineSymbol;
    /**
     * Type guard function that redefines an EsriBaseSymbol as an EsriPictureMarkerSymbol.
     *
     * The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param verifyIfSymbol - Polymorphic object to test in order to determine if the type ascention is valid
     * @returns True if the type ascention is valid
     */
    static isPictureMarkerSymbol: (verifyIfSymbol: EsriBaseSymbol) => verifyIfSymbol is EsriPictureMarkerSymbol;
    /**
     * Type guard function that redefines an EsriBaseRenderer as an EsriSimpleRenderer.
     *
     * The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid
     * @returns True if the type ascention is valid
     */
    static esriRendererIsSimple: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriSimpleRenderer;
    /**
     * Type guard function that redefines an EsriBaseRenderer as an EsriClassBreakRenderer.
     *
     * The type ascention applies only to the true block of the if clause that use this function.
     *
     * @param verifyIfRenderer - Polymorphic object to test in order to determine if the type ascention is valid
     * @returns True if the type ascention is valid
     */
    static esriRendererIsClassBreaks: (verifyIfRenderer: EsriBaseRenderer) => verifyIfRenderer is EsriClassBreakRenderer;
    /**
     * Convert the ESRI line style to the GeoView line style.
     *
     * @param lineStyle - ESRI line style to convert
     * @returns The Geoview line style associated to the ESRI line style
     */
    static convertLineStyle(lineStyle: EsriLineStyle): TypeLineStyle;
    /**
     * Convert the ESRI fill style to the GeoView fill style.
     *
     * @param fillStyle - ESRI fill style to convert
     * @returns The Geoview fill style associated to the ESRI fill style
     */
    static convertFillStyle(fillStyle: EsriFillStyle): TypeFillStyle;
    /**
     * Convert the ESRI symbol style to the GeoView symbol style.
     *
     * @param symbolStyle - ESRI symbol style to convert
     * @returns The Geoview symbol style associated to the ESRI symbol style
     */
    static convertSymbolStyle(symbolStyle: EsriSymbolStyle): TypeSymbol;
    /**
     * Convert an ESRI color to a GeoView color.
     *
     * @param color - ESRI color to convert
     * @returns The Geoview color corresponding to the ESRI color
     */
    static convertEsriColor(color: TypeEsriColor): string;
    /**
     * Convert an ESRI symbol to a GeoView symbol.
     *
     * @param symbol - ESRI symbol to convert
     * @returns The Geoview symbol corresponding to the ESRI symbol, or undefined if not handled
     */
    static convertSymbol(symbol: EsriSymbol): TypeKindOfVectorSettings | undefined;
    /**
     * Get the configuration key of the style.
     *
     * @param settings - GeoView settings
     * @returns The Geoview style key, or undefined if it can not be determined
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