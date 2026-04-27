import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
/** Supported export file formats. */
type FileFormat = 'pdf' | 'png' | 'jpeg';
/** Properties for file export configuration. */
export interface FileExportProps {
    /** The language */
    language: TypeDisplayLanguage;
    /** The export title text. */
    exportTitle: string;
    /** The disclaimer text. */
    disclaimer: string;
    /** The export resolution in DPI. */
    dpi: number;
    /** Optional JPEG quality percentage. */
    jpegQuality?: number;
    /** The output file format. */
    format: FileFormat;
    /** Date display formats keyed by layer path. */
    layerDateFormats: Record<string, TypeDisplayDateFormat>;
    /** Temporal modes keyed by layer path. */
    layerDateTemporalModes: Record<string, TemporalMode>;
}
/**
 * Creates the export modal component for exporting the viewer information.
 *
 * @returns The export modal component
 */
export declare function ExportModal(): JSX.Element;
export {};
//# sourceMappingURL=export-modal.d.ts.map