/// <reference types="react" />
import { PanelApi } from '..';
import { TypeIconButtonProps } from '../icon-button/icon-button-types';
/**
 * Interface for panel properties
 */
type TypePanelAppProps = {
    panel: PanelApi;
    button: TypeIconButtonProps;
    handlePanelOpened?: () => void;
};
/**
 * Create a panel with a header title, icon and content
 * @param {TypePanelAppProps} props panel properties
 *
 * @returns {JSX.Element} the created Panel element
 */
export declare function Panel(props: TypePanelAppProps): JSX.Element;
export declare namespace Panel {
    var defaultProps: {
        handlePanelOpened: null;
    };
}
export {};
