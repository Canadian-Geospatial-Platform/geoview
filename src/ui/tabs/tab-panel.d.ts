import { ReactNode } from 'react';
import { TypeContainerBox } from '@/core/types/global-types';
type TypeChildren = ReactNode;
/**
 * Interface used for the tab panel properties
 */
export interface TypeTabPanelProps {
    index: number;
    value: number;
    id: string;
    children?: TypeChildren;
    containerType?: TypeContainerBox;
}
/**
 * Create a tab panel that will be used to display the content of a tab
 *
 * @param {TypeTabPanelProps} props properties for the tab panel
 * @returns {JSX.Element} returns the tab panel
 */
export declare function TabPanel(props: TypeTabPanelProps): JSX.Element;
export {};
