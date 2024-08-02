import { ReactNode } from 'react';
import { TypeContainerBox } from '@/core/types/global-types';
interface FocusTrapContainerType {
    children: ReactNode;
    id: string;
    containerType?: TypeContainerBox;
    open?: boolean;
}
/**
 * Focus trap container which will trap the focus when navigating through keyboard tab.
 * @param {TypeChildren} children dom elements wrapped in Focus trap.
 * @param {boolean} open enable and disabling of focus trap.
 * @returns {JSX.Element}
 */
export declare function FocusTrapContainer({ children, open, id, containerType }: FocusTrapContainerType): JSX.Element;
export {};
