/// <reference types="react" />
/**
 * Interface used for export button properties
 */
interface ExportProps {
    className?: string;
}
/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
declare function ExportButton(props: ExportProps): JSX.Element;
declare namespace ExportButton {
    var defaultProps: {
        className: string;
    };
}
export default ExportButton;
