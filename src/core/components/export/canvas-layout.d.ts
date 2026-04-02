import { type TemporalMode, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { FileExportProps } from '@/core/components/export/export-modal';
import type { FlattenedLegendItem, NorthArrowSVG } from '@/core/components/export/utilities';
/** Properties for the Canvas export document component. */
interface CanvasDocumentProps {
    /** The base64-encoded map image data URL. */
    mapDataUrl: string;
    /** The export title text. */
    exportTitle: string;
    /** The scale bar text label. */
    scaleText: string;
    /** The scale line width as CSS string. */
    scaleLineWidth: string;
    /** Optional north arrow SVG path data. */
    northArrowSvg?: NorthArrowSVG[];
    /** The north arrow rotation angle in degrees. */
    northArrowRotation: number;
    /** The disclaimer text. */
    disclaimer: string;
    /** Array of attribution texts. */
    attributions: string[];
    /** Date display formats keyed by layer path. */
    layerDateFormats: Record<string, TypeDisplayDateFormat>;
    /** Temporal modes keyed by layer path. */
    layerDateTemporalModes: Record<string, TemporalMode>;
    /** Pre-organized legend items grouped into columns. */
    fittedColumns: FlattenedLegendItem[][];
    /** Optional array of column widths in pixels. */
    columnWidths?: number[];
    /** The canvas width in pixels. */
    canvasWidth: number;
}
/**
 * Creates the Canvas document for the map export.
 *
 * @param props - Properties defined in CanvasDocumentProps interface
 * @returns The rendered HTML canvas document
 */
export declare function CanvasDocument({ mapDataUrl, exportTitle, scaleText, scaleLineWidth, northArrowSvg, northArrowRotation, fittedColumns, columnWidths, disclaimer, attributions, layerDateFormats, layerDateTemporalModes, canvasWidth, }: CanvasDocumentProps): JSX.Element;
/**
 * Creates the HTML map and converts to canvas then image for the export.
 *
 * @param mapId - The map ID
 * @param props - The file export properties
 * @returns A promise that resolves with a data URL for the exported image
 */
export declare function createCanvasMapUrls(mapId: string, props: FileExportProps): Promise<string>;
export {};
//# sourceMappingURL=canvas-layout.d.ts.map