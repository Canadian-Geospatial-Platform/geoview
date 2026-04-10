interface LayerInfoPanelProps {
    /** The layer path to display information for. */
    layerPath: string;
}
/**
 * Panel view for layer information content.
 *
 * Displays layer type, projection, bounds, active filters, temporal settings,
 * resource links, and metadata links. The header and back navigation are
 * handled by the parent.
 *
 * @param layerPath - The layer path to display information for.
 */
export declare function LayerInfoPanel({ layerPath }: LayerInfoPanelProps): JSX.Element | null;
export {};
//# sourceMappingURL=layer-info.d.ts.map