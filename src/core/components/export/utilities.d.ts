import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeNorthArrow, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import { type TypeTimeSliderValues } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
/** Constants for export configuration. */
export declare const EXPORT_CONSTANTS: {
    /** DPI and quality settings */
    readonly DEFAULT_DPI: 96;
    readonly JPEG_QUALITY: 0.98;
    /** Column optimization settings */
    readonly COLUMN_BALANCE_THRESHOLD: 0.8;
    readonly MAX_OPTIMIZATION_ITERATIONS: 20;
    readonly DEFAULT_MAX_COLUMNS: 4;
    readonly COLUMN_GAP: 10;
    /** WMS image constraints */
    readonly WMS_MAX_WIDTH: 500;
    readonly WMS_INDENT_PER_LEVEL: 10;
};
/** Map state properties needed for export layout rendering. */
export type TypeMapStateForExportLayout = {
    attribution: string[];
    northArrow: boolean;
    northArrowElement: TypeNorthArrow;
    mapScale: TypeScaleInfo;
    mapRotation: number;
    currentProjection: number;
};
/** North arrow SVG path data. */
export type NorthArrowSVG = {
    d: string | null;
    fill: string | null;
    stroke: string | null;
    strokeWidth: string | null;
};
/** Flattened legend item for layout processing. */
export type FlattenedLegendItem = {
    type: 'layer' | 'item' | 'child' | 'wms' | 'time';
    data: TypeLegendLayer;
    parentName?: string;
    depth: number;
    isRoot: boolean;
    timeInfo?: TypeTimeSliderValues;
    calculatedHeight?: number;
    calculatedWidth?: number;
    wmsImageSize?: {
        width: number;
        height: number;
    };
};
/** Element factory interface for creating renderer-specific elements (Canvas/HTML or PDF). */
export interface ElementFactory {
    View: (props: any) => JSX.Element;
    Text: (props: any) => JSX.Element;
    Image: (props: any) => JSX.Element;
    Span: (props: any) => JSX.Element;
    Svg: (props: any) => JSX.Element;
    Path: (props: any) => JSX.Element;
}
/** Result type containing all map export information. */
export type TypeMapInfoResult = {
    mapDataUrl: string;
    scaleText: string;
    scaleLineWidth: string;
    northArrowSvg?: NorthArrowSVG[];
    northArrowRotation: number;
    attributions: string[];
    fittedColumns: FlattenedLegendItem[][];
    columnWidths?: number[];
    canvasWidth: number;
    canvasHeight: number;
};
/** Utility class providing static methods for map export processing and layout rendering. */
export declare class ExportUtilities {
    #private;
    /**
     * Renders multiple legend columns in a flexbox container with dynamic or fixed widths.
     *
     * Uses space-between justification when columnWidths are provided to eliminate gaps.
     * Falls back to gap-based layout for equal-width columns.
     *
     * Layout modes:
     * - With columnWidths: Justified layout, each column has exact width, no gaps
     * - Without columnWidths: Flexible layout, columns share available space with gaps in between
     *
     * @param columns - Array of columns, each containing legend items
     * @param factory - Element factory for creating renderer-specific elements
     * @param scaledStyles - The scaled styles object for sizing
     * @param baseStyles - The base styles object for layout
     * @param layerDateFormats - Date formats for layers
     * @param layerDateTemporalModes - Temporal modes for layers
     * @param columnWidths - Optional array of column widths in pixels for justified layout
     * @returns The rendered legend container with all columns
     */
    static renderLegendColumns(columns: FlattenedLegendItem[][], factory: ElementFactory, scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    baseStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    layerDateFormats: Record<string, TypeDisplayDateFormat>, layerDateTemporalModes: Record<string, TemporalMode>, columnWidths?: number[]): JSX.Element;
    /**
     * Renders the footer section with disclaimer, attributions, and date.
     *
     * @param disclaimer - The disclaimer text to display
     * @param attributions - Array of attribution texts (one per map layer)
     * @param factory - Element factory for creating renderer-specific elements
     * @param scaledStyles - The scaled styles object with footer styling
     * @returns The rendered footer container
     */
    static renderFooter(disclaimer: string, attributions: string[], factory: ElementFactory, scaledStyles: any): JSX.Element;
    /**
     * Renders a scale bar with tick marks and label text.
     *
     * The scale bar width is dynamically calculated to match the map extent.
     *
     * @param scaleText - The scale text label (e.g., "100 km (approx)")
     * @param scaleLineWidth - The scale line width as CSS string (e.g., "150px")
     * @param factory - Element factory for creating renderer-specific elements
     * @param scaledStyles - The scaled styles object for text sizing
     * @param baseStyles - The base styles object for scale bar layout
     * @returns The rendered scale bar container
     */
    static renderScaleBar(scaleText: string, scaleLineWidth: string, factory: ElementFactory, scaledStyles: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    baseStyles: any): JSX.Element;
    /**
     * Renders a north arrow SVG icon with rotation to indicate true north direction.
     *
     * The rotation accounts for both map rotation and user-configured north arrow orientation.
     * Returns null if north arrow is disabled or SVG data is unavailable.
     *
     * @param northArrowSvg - Array of SVG path data with stroke/fill properties
     * @param northArrowRotation - The rotation angle in degrees
     * @param factory - Element factory for creating renderer-specific elements
     * @param scaledStyles - The scaled styles object for sizing and rotation
     * @returns The rendered north arrow SVG, or null if disabled
     */
    static renderNorthArrow(northArrowSvg: NorthArrowSVG[] | undefined, northArrowRotation: number, factory: ElementFactory, scaledStyles: any): JSX.Element | null;
    /**
     * Main export processing function - gathers map data, processes legend, and optimizes layout.
     *
     * Workflow (AUTO mode only):
     * 1. Captures map canvas at browser dimensions (maintains extent/scale)
     * 2. Extracts scale bar, north arrow, and attribution data
     * 3. Filters and flattens legend layers by visibility
     * 4. Pre-calculates WMS image heights by loading images
     * 5. Measures actual rendered dimensions of each layer group in DOM
     * 6. Calculates optimal column count (2-4) based on available width
     * 7. Distributes layer groups across columns evenly
     * 8. Optimizes column balance using 2-step look-ahead algorithm (max 20 iterations)
     * 9. Calculates column widths for justified layout (eliminates gaps)
     * 10. Captures actual WMS image dimensions after layout
     * 11. Measures final canvas height with actual title/disclaimer for accurate sizing
     *
     * Key features:
     * - Uses actual DOM measurement for accuracy (no estimation)
     * - Maintains map extent by using browser canvas dimensions
     * - Handles map rotation via canvas transforms
     * - Balances columns within 80% height ratio threshold
     * - All content fits on single auto-sized page
     *
     * @param mapId - The GeoView map ID
     * @param exportTitle - The export title (affects height calculation)
     * @param disclaimer - The disclaimer text (affects height calculation)
     * @param layerDateFormats - Date formats for layers
     * @param layerDateTemporalModes - Temporal modes for layers
     * @returns A promise that resolves with map image URL, scale info, north arrow, legend columns, and canvas dimensions
     * @throws {Error} When canvas context is unavailable
     */
    static getMapInfo(mapId: string, displayLanguage: TypeDisplayLanguage, exportTitle: string, disclaimer: string, layerDateFormats: Record<string, TypeDisplayDateFormat>, layerDateTemporalModes: Record<string, TemporalMode>): Promise<TypeMapInfoResult>;
}
//# sourceMappingURL=utilities.d.ts.map