/** Properties for the WMS style settings panel. */
interface WmsStylePanelProps {
    /** The layer path to configure WMS styles for. */
    layerPath: string;
}
/**
 * Creates the inline WMS style settings panel.
 *
 * Displays available styles as cards within a collapsible section,
 * consistent with the raster function panel pattern.
 *
 * @param props - Properties defined in WmsStylePanelProps interface
 * @returns The WMS style panel
 */
export declare function WmsStylePanel({ layerPath }: WmsStylePanelProps): JSX.Element;
export {};
//# sourceMappingURL=wms-style-selector.d.ts.map