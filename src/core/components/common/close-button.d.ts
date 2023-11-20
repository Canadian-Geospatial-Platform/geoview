import { SetStateAction, Dispatch } from 'react';
interface CloseButtonProps {
    isLayersPanelVisible: boolean;
    setIsLayersPanelVisible: Dispatch<SetStateAction<boolean>>;
}
/**
 * Create close button
 * @param {boolean} isLayersPanelVisible show/hide the list in left panel
 * @param {function} setIsLayersPanelVisible dispatch function to update isLayersPanelVisible
 * @returns JSX.element
 */
export declare function CloseButton({ isLayersPanelVisible, setIsLayersPanelVisible }: CloseButtonProps): import("react").JSX.Element;
export {};
