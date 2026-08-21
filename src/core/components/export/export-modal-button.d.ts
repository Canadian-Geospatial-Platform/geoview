import type { SxProps, Theme } from '@mui/material/styles';
/** Props for the ExportButton component. */
interface ExportProps {
    /** The button element id. */
    id: string;
    /** Optional CSS class name. */
    className?: string;
    /** Optional additional sx styles. */
    sxDetails?: SxProps<Theme>;
}
/**
 * Creates the export PNG button component.
 *
 * @param props - Properties defined in ExportProps interface
 * @returns The export button
 */
export default function ExportButton({ id, className, sxDetails }: ExportProps): JSX.Element;
export {};
//# sourceMappingURL=export-modal-button.d.ts.map