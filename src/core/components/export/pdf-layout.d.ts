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
export declare function ExportDocument({ mapDataUrl, exportTitle, scaleText, scaleLineWidth, northArrowSvg, northArrowRotation, disclaimer, attributions, date, fittedColumns, fittedOverflowItems, pageSize, }: ExportDocumentProps): JSX.Element;
export declare function createPDFMapUrl(mapId: string, params: FileExportProps): Promise<string>;
export {};
//# sourceMappingURL=pdf-layout.d.ts.map