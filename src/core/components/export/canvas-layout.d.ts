import { FileExportProps } from './export-modal';
import { FlattenedLegendItem, TypeValidPageSizes } from './utilities';
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
    pageSize: TypeValidPageSizes;
}
/**
 * The Canvas that is created for the map export
 * @param {CanvasDocumentProps} props - The Canvas Document properties
 * @returns {JSX.Element} The resulting html map
 */
export declare function CanvasDocument({ mapDataUrl, exportTitle, scaleText, scaleLineWidth, northArrowSvg, northArrowRotation, fittedColumns, disclaimer, attributions, date, pageSize, }: CanvasDocumentProps): JSX.Element;
/**
 * Creates the HTML map and converts to canvas and then image for the export
 * @param {string} mapId - The map ID
 * @param {FileExportProps} props - The file export props
 * @returns {Promise<string[]>} A string of URLs for the images (Map and overflow pages)
 */
export declare function createCanvasMapUrls(mapId: string, props: FileExportProps): Promise<string[]>;
export {};
//# sourceMappingURL=canvas-layout.d.ts.map