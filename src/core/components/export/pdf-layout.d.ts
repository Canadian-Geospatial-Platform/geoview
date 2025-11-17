import type { FlattenedLegendItem } from '@/core/components/export/utilities';
import type { FileExportProps } from '@/core/components/export/export-modal';
interface ExportDocumentProps {
    mapDataUrl: string;
    exportTitle: string;
    scaleText: string;
    scaleLineWidth: string;
    northArrowSvg: Array<{
        d: string | null;
        fill: string | null;
        stroke: string | null;
        strokeWidth: string | null;
    }> | null;
    northArrowRotation: number;
    disclaimer: string;
    attributions: string[];
    date: string;
    fittedColumns: FlattenedLegendItem[][];
    columnWidths?: number[];
    canvasWidth: number;
    canvasHeight: number;
}
/**
 * The PDF export document that is created for the map export
 * @param {ExportDocumentProps} props - The PDF Export Document properties
 * @returns {JSX.Element} The resulting html map
 */
export declare function ExportDocument({ mapDataUrl, exportTitle, scaleText, scaleLineWidth, northArrowSvg, northArrowRotation, disclaimer, attributions, date, fittedColumns, columnWidths, canvasWidth, canvasHeight, }: ExportDocumentProps): JSX.Element;
/**
 * Creates the PDF map for the export
 * @param {string} mapId - The map ID
 * @param {FileExportProps} props - The file export props
 * @returns {Promise<string>} A string URL for the document
 */
export declare function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string>;
export {};
//# sourceMappingURL=pdf-layout.d.ts.map