import { ReactElement } from 'react';
interface FocusTrapContainerType {
    children: ReactElement;
    open: boolean;
}
/**
 * Focus trap container which will trap the focus when navigating through keyboard tab.
 * @param {ReactElement} children dom elements wrapped in Focus trap.
 * @param {boolean} open enable and disabling of focus trap.
 * @returns {JSX.Element}
 */
export declare function FocusTrapContainer({ children, open }: FocusTrapContainerType): JSX.Element;
export {};
