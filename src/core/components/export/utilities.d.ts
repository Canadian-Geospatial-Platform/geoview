import type { TypeNorthArrow, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeTimeSliderValues, TimeSliderLayerSet } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
export type TypeValidPageSizes = 'LETTER' | 'TABLOID' | 'LEGAL';
export type TypeMapStateForExportLayout = {
    attribution: string[];
    northArrow: boolean;
    northArrowElement: TypeNorthArrow;
    mapScale: TypeScaleInfo;
    mapRotation: number;
};
export interface FlattenedLegendItem {
    type: 'layer' | 'item' | 'child' | 'wms' | 'time';
    data: TypeLegendLayer;
    parentName?: string;
    depth: number;
    isRoot: boolean;
    timeInfo?: TypeTimeSliderValues;
    calculatedHeight?: number;
}
export type TypePageConfig = (typeof PAGE_CONFIGS)[keyof typeof PAGE_CONFIGS];
export type TypeMapInfoResult = {
    mapDataUrl: string;
    scaleText: string;
    scaleLineWidth: string;
    northArrowSvg: Array<{
        d: string | null;
        fill: string | null;
        stroke: string | null;
        strokeWidth: string | null;
    }> | null;
    northArrowRotation: number;
    attributions: string[];
    fittedColumns: FlattenedLegendItem[][];
    fittedOverflowItems?: FlattenedLegendItem[][];
};
export declare const PAGE_CONFIGS: {
    LETTER: {
        size: "LETTER";
        mapHeight: number;
        legendColumns: number;
        maxLegendHeight: number;
        canvasWidth: number;
        canvasHeight: number;
    };
    LEGAL: {
        size: "LEGAL";
        mapHeight: number;
        legendColumns: number;
        maxLegendHeight: number;
        canvasWidth: number;
        canvasHeight: number;
    };
    TABLOID: {
        size: "TABLOID";
        mapHeight: number;
        legendColumns: number;
        maxLegendHeight: number;
        canvasWidth: number;
        canvasHeight: number;
    };
};
/**
 * Filter and flatten layers for placement in the legend
 * @param {TypeLegendLayer[]} layers - The legend layers to be shown in the legend
 * @param {TypeOrdderedLayerInfo[]} orderedLayerInfo - The orderedLayerInfo to be used to filter out layers that aren't visible
 * @param {TimeSliderLayerSet} timeSliderLayers - Any layers that are time enabled
 * @returns {FlattenedLegendItem[]} The flattened list of all the items in the legend
 */
export declare const processLegendLayers: (layers: TypeLegendLayer[], orderedLayerInfo: TypeOrderedLayerInfo[], timeSliderLayers?: TimeSliderLayerSet) => FlattenedLegendItem[];
/**
 * Group items by their root layer and distribute in the columns
 * @param {FlattenedLegendItem[]} items - The flattened list of legend items to be placed in the legend
 * @param {number} numColumns - The maximum number of columns that can be used
 * @param {number} maxHeight - The maximum height available on the rest of the page
 * @param {string} disclaimer - The disclaimer text to be displayed in the footer
 * @param {string[]} attributions - The attributions to be displayed in the footer
 * @returns {FlattenedLegendItem[][]} The flattened legend items distributed between the columns
 */
export declare const distributeIntoColumns: (items: FlattenedLegendItem[], numColumns: number, maxLegendHeight: number, disclaimer: string, attributions: string[], pageSize: TypeValidPageSizes, exportTitle?: string) => {
    fittedColumns: FlattenedLegendItem[][];
    overflowItems: FlattenedLegendItem[];
};
/**
 * Gathers information about the map for sizing and creates the map image url for placement in the layout
 * @param {string} mapId - The map ID
 * @param {TypeValidPageSizes} pageSize - The page size for aspect ratio
 * @param {string} disclaimer - The disclaimer text
 * @param {string} title - The title text
 * @returns {TypeMapInfoResult} The map image data URL and browser canvas size
 */
export declare function getMapInfo(mapId: string, pageSize: TypeValidPageSizes, disclaimer: string, title: string): Promise<TypeMapInfoResult>;
//# sourceMappingURL=utilities.d.ts.map