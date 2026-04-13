interface WmsStylePanelProps {
    /** The layer path to configure WMS styles for. */
    layerPath: string;
}
/**
 * Inline panel section for selecting WMS styles.
 *
 * Displays available styles as cards within a collapsible section,
 * consistent with the raster function panel pattern.
 *
 * @param layerPath - The layer path to configure WMS styles for.
 * @returns A JSX element representing the WMS style panel.
 */
export declare function WmsStylePanel({ layerPath }: WmsStylePanelProps): JSX.Element;
export {};
//# sourceMappingURL=wms-style-selector.d.ts.map