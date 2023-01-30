import { MouseEventHandler } from 'react';
/**
 * Interface used for home button properties
 */
interface ExportProps {
    className?: string | undefined;
    openModal: MouseEventHandler<HTMLButtonElement>;
}
/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
declare function Export(props: ExportProps): JSX.Element;
declare namespace Export {
    var defaultProps: {
        className: string;
    };
}
export default Export;
