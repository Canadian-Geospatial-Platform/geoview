import type { TypeNorthArrow, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeTimeSliderValues, TimeSliderLayerSet } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
export type TypeValidPageSizes = 'AUTO';
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
    AUTO: {
        size: "AUTO";
        mapHeight: number;
        legendColumns: number;
        maxLegendHeight: number;
        canvasWidth: number;
        canvasHeight: number;
    };
};
/**
 * Element factory interface for creating renderer-specific elements
 * Allows us to abstract between Canvas (HTML) and PDF rendering
 */
export interface ElementFactory {
    View: (props: any) => JSX.Element;
    Text: (props: any) => JSX.Element;
    Image: (props: any) => JSX.Element;
    Span: (props: any) => JSX.Element;
    Svg: (props: any) => JSX.Element;
    Path: (props: any) => JSX.Element;
}
/**
 * Renders a single legend item using the provided element factory
 * @param {FlattenedLegendItem} item - The item to render
 * @param {number} itemIndex - Index of the item in the column
 * @param {number} indentLevel - The indentation level (0-3)
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @param {any} baseStyles - The base styles object (CANVAS_STYLES or PDF_STYLES)
 * @returns {JSX.Element} The rendered item
 */
export declare const renderSingleLegendItem: (item: FlattenedLegendItem, itemIndex: number, indentLevel: number, factory: ElementFactory, scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
baseStyles: any) => JSX.Element;
/**
 * Groups items into containers - wraps content items
 * @param {FlattenedLegendItem[]} column - The column items to render
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @param {any} baseStyles - The base styles object
 * @returns {JSX.Element[]} Array of rendered elements
 */
export declare const renderColumnItems: (column: FlattenedLegendItem[], factory: ElementFactory, scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
baseStyles: any) => JSX.Element[];
/**
 * Renders legend columns using the provided element factory
 * @param {FlattenedLegendItem[][]} columns - The columns to render
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @param {any} baseStyles - The base styles object
 * @returns {JSX.Element} The rendered legend
 */
export declare const renderLegendColumns: (columns: FlattenedLegendItem[][], factory: ElementFactory, scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
baseStyles: any) => JSX.Element;
/**
 * Renders footer section
 * @param {string} disclaimer - The disclaimer text
 * @param {string[]} attributions - The attribution texts
 * @param {string} date - The date string
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @returns {JSX.Element} The rendered footer
 */
export declare const renderFooter: (disclaimer: string, attributions: string[], date: string, factory: ElementFactory, scaledStyles: any) => JSX.Element;
/**
 * Renders scale bar with ticks
 * @param {string} scaleText - The scale text
 * @param {string} scaleLineWidth - The scale line width
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @param {any} baseStyles - The base styles object
 * @returns {JSX.Element} The rendered scale bar
 */
export declare const renderScaleBar: (scaleText: string, scaleLineWidth: string, factory: ElementFactory, scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
baseStyles: any) => JSX.Element;
/**
 * Renders north arrow SVG
 * @param {Array} northArrowSvg - The north arrow SVG path data
 * @param {number} northArrowRotation - The rotation angle
 * @param {ElementFactory} factory - Element factory for creating elements
 * @param {any} scaledStyles - The scaled styles object
 * @returns {JSX.Element | null} The rendered north arrow or null
 */
export declare const renderNorthArrow: (northArrowSvg: Array<{
    d: string | null;
    fill: string | null;
    stroke: string | null;
    strokeWidth: string | null;
}> | null, northArrowRotation: number, factory: ElementFactory, scaledStyles: any) => JSX.Element | null;
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
 * @param {TypeValidPageSizes} pageSize - The page size for calculation
 * @param {number} scale - The scale factor based on document width
 * @returns {FlattenedLegendItem[][][]} The flattened legend items distributed into rows and columns
 */
export declare const distributeIntoColumns: (items: FlattenedLegendItem[], numColumns: number, pageSize: TypeValidPageSizes, scale?: number) => {
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