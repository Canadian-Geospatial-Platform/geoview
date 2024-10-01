import { KeyboardEvent } from 'react';
import { TypePanelProps } from '..';
import { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';
/**
 * Interface for panel properties
 */
export type TypePanelAppProps = {
    panel: TypePanelProps;
    button: TypeIconButtonProps;
    onGeneralCloseClicked?: () => void;
    onPanelOpened?: () => void;
    onPanelClosed?: () => void;
    handleKeyDown?: (event: KeyboardEvent) => void;
};
/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
export declare function Panel(props: TypePanelAppProps): JSX.Element;
