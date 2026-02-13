import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeContainerBox } from '@/core/types/global-types';
/**
 * Properties for the LegendFullscreen component.
 * @interface LegendFullscreenProps
 * @property {TypeLegendLayer[]} layersList - Array of legend layers to display in fullscreen mode.
 * @property {string} mapId - The unique identifier of the map.
 * @property {TypeContainerBox} containerType - The type of container where the legend is displayed.
 * @property {boolean} isOpen - Controls whether the fullscreen dialog is open.
 * @property {() => void} onClose - Callback function invoked when the fullscreen dialog is closed.
 */
interface LegendFullscreenProps {
    layersList: TypeLegendLayer[];
    mapId: string;
    containerType: TypeContainerBox;
    isOpen: boolean;
    onClose: () => void;
}
/**
 * Properties for the LegendFullscreenButton component.
 * @interface FullscreenButtonProps
 * @property {TypeContainerBox} containerType - The type of container where the button is displayed.
 * @property {() => void} onClick - Callback function invoked when the button is clicked.
 */
interface FullscreenButtonProps {
    containerType: TypeContainerBox;
    onClick: () => void;
}
/**
 * Renders a button that opens the legend in fullscreen mode.
 * Only displays when the legend is shown in the app bar container.
 * @param {FullscreenButtonProps} props - The component properties.
 * @param {TypeContainerBox} props.containerType - The type of container where the button is displayed.
 * @param {() => void} props.onClick - Callback function invoked when the fullscreen button is clicked.
 * @returns {JSX.Element | null} The fullscreen button element, or null if not in the app bar.
 */
export declare function LegendFullscreenButton({ containerType, onClick }: FullscreenButtonProps): JSX.Element | null;
/**
 * Renders the legend in a fullscreen dialog with responsive multi-column layout.
 * Manages layer collapse state by expanding all layers when entering fullscreen and
 * restoring the previous collapse state when exiting.
 * @param {LegendFullscreenProps} props - The component properties.
 * @param {TypeLegendLayer[]} props.layersList - Array of legend layers to display.
 * @param {string} props.mapId - The unique identifier of the map.
 * @param {TypeContainerBox} props.containerType - The type of container where the legend is displayed.
 * @param {boolean} props.isOpen - Controls whether the fullscreen dialog is open.
 * @param {() => void} props.onClose - Callback function invoked when the dialog is closed.
 * @returns {JSX.Element} The fullscreen legend dialog component.
 */
export declare function LegendFullscreen({ layersList, mapId, containerType, isOpen, onClose }: LegendFullscreenProps): JSX.Element;
export {};
//# sourceMappingURL=legend-fullscreen.d.ts.map