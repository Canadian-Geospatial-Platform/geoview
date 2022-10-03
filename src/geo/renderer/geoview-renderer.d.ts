import { Style } from 'ol/style';
import { FeatureLike } from 'ol/Feature';
import { TypeVectorLayerEntryConfig, TypeVectorTileLayerEntryConfig, TypeBaseVectorLayerEntryConfig } from '../map/map-schema-types';
/** *****************************************************************************************************************************
 * A class to define the GeoView renderers.
 *
 * @exports
 * @class GeoviewRenderer
 */
export declare class GeoviewRenderer {
    private mapId;
    /** index used to select the default styles */
    private defaultColorIndex;
    private lineDashSettings;
    /** Table of function to process the style settings. */
    private processStyle;
    private styleNotImplemented;
    private processSymbol;
    private processFillStyle;
    constructor(mapId: string);
    getStyle(feature: FeatureLike, layerEntryConfig: TypeBaseVectorLayerEntryConfig | TypeVectorTileLayerEntryConfig | TypeVectorLayerEntryConfig): Style | undefined;
    private incrementDefaultColorIndex;
    private getDefaultColorAndIncrementIndex;
    private getDefaultColor;
    private createStrokeOptions;
    private processCircleSymbol;
    private processStarShapeSymbol;
    private processStarSymbol;
    private processXSymbol;
    private processPlusSymbol;
    private processRegularShape;
    private processSquareSymbol;
    private processDiamondSymbol;
    private processTriangleSymbol;
    private processIconSymbol;
    private processSimplePoint;
    private processSimpleLineString;
    private processSolidFill;
    private processNullFill;
    private fillPaternSettings;
    private processPaternFill;
    private processBackwardDiagonalFill;
    private processForwardDiagonalFill;
    private processCrossFill;
    private processDiagonalCrossFill;
    private processHorizontalFill;
    private processVerticalFill;
    private processSimplePolygon;
    private searchUniqueValueEntry;
    private processUniqueValuePoint;
    private processUniqueLineString;
    private processUniquePolygon;
    private searchClassBreakEntry;
    private processClassBreaksPoint;
    private processClassBreaksLineString;
    private processClassBreaksPolygon;
    private createDefaultStyle;
}
