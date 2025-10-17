import type { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
import type { FileExportProps } from './export-modal';
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
    fittedOverflowItems?: FlattenedLegendItem[][];
    pageSize: TypeValidPageSizes;
}
/**
 * The pdf document that is created for the export
 * @param {ExportDocumentProps} props - The props to be used to create the pdf document
 * @returns {JSX.Element} The rendered pdf document
 */
export declare function ExportDocument({ mapDataUrl, exportTitle, scaleText, scaleLineWidth, northArrowSvg, northArrowRotation, disclaimer, attributions, date, fittedColumns, fittedOverflowItems, pageSize, }: ExportDocumentProps): JSX.Element;
/**
 * Creates the PDF map and returns the url for download
 * @param {string} mapId - THe map ID
 * @param {FileExportProps} params - The file export props
 * @returns {Promise<string>} The URL for the PDF map
 */
export declare function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string>;
export {};
//# sourceMappingURL=pdf-layout.d.ts.map