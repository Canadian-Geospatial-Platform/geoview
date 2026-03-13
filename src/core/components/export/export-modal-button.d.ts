/**
 * Interface used for export button properties
 */
interface ExportProps {
    id: string;
    ariaControls: string;
    className?: string;
    sxDetails?: object;
    ariaExpanded?: boolean;
}
/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export default function ExportButton({ id, ariaControls, className, sxDetails, ariaExpanded }: ExportProps): JSX.Element;
export {};
//# sourceMappingURL=export-modal-button.d.ts.map