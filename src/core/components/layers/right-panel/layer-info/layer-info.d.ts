interface LayerInfoPanelProps {
    /** The layer path to display information for. */
    layerPath: string;
}
/**
 * Creates the layer information panel component.
 *
 * Displays layer type, projection, bounds, active filters, temporal settings,
 * resource links, and metadata links. The header and back navigation are
 * handled by the parent.
 *
 * @param props - Properties defined in LayerInfoPanelProps interface
 * @returns The layer information panel component, or null if unavailable
 */
export declare function LayerInfoPanel({ layerPath }: LayerInfoPanelProps): JSX.Element | null;
export {};
//# sourceMappingURL=layer-info.d.ts.map