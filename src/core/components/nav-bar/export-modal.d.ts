import { MouseEventHandler } from 'react';
/**
 * Interface used for home button properties
 */
interface ExportModalProps {
    className?: string | undefined;
    isShown: boolean;
    closeModal: MouseEventHandler<HTMLElement>;
}
/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
declare function ExportModal(props: ExportModalProps): JSX.Element;
declare namespace ExportModal {
    var defaultProps: {
        className: string;
    };
}
export default ExportModal;
