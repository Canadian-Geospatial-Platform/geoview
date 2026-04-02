import { type TemporalMode, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { FlattenedLegendItem, NorthArrowSVG } from '@/core/components/export/utilities';
import type { FileExportProps } from '@/core/components/export/export-modal';
/** Properties for the PDF export document component. */
interface ExportDocumentProps {
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
    /** The canvas height in pixels. */
    canvasHeight: number;
}
/**
 * Creates the PDF export document for the map export.
 *
 * @param props - Properties defined in ExportDocumentProps interface
 * @returns The rendered PDF document
 */
export declare function ExportDocument({ mapDataUrl, exportTitle, scaleText, scaleLineWidth, northArrowSvg, northArrowRotation, disclaimer, attributions, layerDateFormats, layerDateTemporalModes, fittedColumns, columnWidths, canvasWidth, canvasHeight, }: ExportDocumentProps): JSX.Element;
/**
 * Creates the PDF map for the export.
 *
 * @param mapId - The map ID
 * @param params - The file export properties
 * @returns A promise that resolves with a string URL for the document
 */
export declare function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string>;
export {};
//# sourceMappingURL=pdf-layout.d.ts.map