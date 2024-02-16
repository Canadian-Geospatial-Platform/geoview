import { SetStateAction, Dispatch } from 'react';
interface CloseButtonProps {
    isLayersPanelVisible: boolean;
    onSetIsLayersPanelVisible: Dispatch<SetStateAction<boolean>>;
    fullWidth?: boolean;
}
/**
 * Create close button
 * @param {boolean} isLayersPanelVisible show/hide the list in left panel
 * @param {function} setIsLayersPanelVisible dispatch function to update isLayersPanelVisible
 * @param {boolean} fullWidth show close button when full width is true
 * @returns JSX.element
 */
export declare function CloseButton({ isLayersPanelVisible, onSetIsLayersPanelVisible, fullWidth }: CloseButtonProps): import("react").JSX.Element;
export declare namespace CloseButton {
    var defaultProps: {
        fullWidth: boolean;
    };
}
export {};
