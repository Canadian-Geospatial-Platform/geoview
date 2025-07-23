export interface TypeIconStackProps {
    layerPath: string;
}
interface LayerIconProps {
    layerPath: string;
}
/**
 * Renders an appropriate icon for a layer based on its status and type.
 * Shows loading spinner, error icon, group icon, or layer legend icons as needed.
 * @param {LayerIconProps} props - The component props
 * @param {string} props.layerPath - The path identifier for the layer
 * @returns {JSX.Element} The rendered layer icon component
 */
export declare function LayerIcon({ layerPath }: LayerIconProps): JSX.Element;
export {};
//# sourceMappingURL=layer-icon.d.ts.map