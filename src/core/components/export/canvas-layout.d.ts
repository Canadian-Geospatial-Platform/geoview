import type { FileExportProps } from '@/core/components/export/export-modal';
import type { FlattenedLegendItem } from '@/core/components/export/utilities';
interface CanvasDocumentProps {
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
}
/**
 * The Canvas that is created for the map export
 * @param {CanvasDocumentProps} props - The Canvas Document properties
 * @returns {JSX.Element} The resulting html map
 */
export declare function CanvasDocument({ mapDataUrl, exportTitle, scaleText, scaleLineWidth, northArrowSvg, northArrowRotation, fittedColumns, columnWidths, disclaimer, attributions, date, canvasWidth, }: CanvasDocumentProps): JSX.Element;
/**
 * Creates the HTML map and converts to canvas and then image for the export
 * @param {string} mapId - The map ID
 * @param {FileExportProps} props - The file export props
 * @returns {Promise<string>} A data URL for the exported image
 */
export declare function createCanvasMapUrls(mapId: string, props: FileExportProps): Promise<string>;
export {};
//# sourceMappingURL=canvas-layout.d.ts.map