import { KeyboardEvent } from 'react';
import { TypePanelProps } from '@/ui/panel/panel-types';
import { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
/**
 * Interface for panel properties
 */
export type TypePanelAppProps = {
    panel: TypePanelProps;
    button: IconButtonPropsExtend;
    onGeneralClose?: () => void;
    onOpen?: () => void;
    onClose?: () => void;
    onKeyDown?: (event: KeyboardEvent) => void;
};
/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
declare function PanelUI(props: TypePanelAppProps): JSX.Element;
export declare const Panel: typeof PanelUI;
export {};
