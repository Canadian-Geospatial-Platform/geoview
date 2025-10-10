type FileFormat = 'pdf' | 'png' | 'jpeg';
type DocumentSize = 'LETTER' | 'LEGAL' | 'TABLOID';
export interface FileExportProps {
    exportTitle: string;
    disclaimer: string;
    pageSize: DocumentSize;
    dpi: number;
    jpegQuality?: number;
    format: FileFormat;
}
/**
 * Export modal window component to export the viewer information in a PNG file
 *
 * @returns {JSX.Element} the export modal component
 */
export default function ExportModal(): JSX.Element;
export {};
//# sourceMappingURL=export-modal.d.ts.map