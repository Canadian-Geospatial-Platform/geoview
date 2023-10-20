import { MouseEventHandler } from 'react';
/**
 * Interface used for home button properties
 */
interface ExportProps {
    openModal: MouseEventHandler<HTMLButtonElement>;
}
/**
 * Export PNG Button component
 *
 * @returns {JSX.Element} the export button
 */
export default function Export(props: ExportProps): JSX.Element;
export {};
