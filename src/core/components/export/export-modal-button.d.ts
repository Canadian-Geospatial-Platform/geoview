/**
 * Interface used for export button properties
 */
interface ExportProps {
    className?: string;
    sxDetails?: object;
}
/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export default function ExportButton({ className, sxDetails }: ExportProps): JSX.Element;
export {};
