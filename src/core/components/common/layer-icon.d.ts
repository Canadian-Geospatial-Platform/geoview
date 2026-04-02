/** Properties for the IconStack component. */
export interface TypeIconStackProps {
    layerPath: string;
}
/** Properties for the LayerIcon component. */
interface LayerIconProps {
    layerPath: string;
}
/**
 * Renders an appropriate icon for a layer based on its status and type.
 *
 * Shows loading spinner, error icon, group icon, or layer legend icons as needed.
 *
 * @param props - LayerIcon properties
 * @returns The rendered layer icon element
 */
export declare function LayerIcon({ layerPath }: LayerIconProps): JSX.Element;
export {};
//# sourceMappingURL=layer-icon.d.ts.map