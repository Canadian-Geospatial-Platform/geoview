import type { TypeLegendLayer } from '@/core/components/layers/types';
interface WmsStylePanelProps {
    layerDetails: TypeLegendLayer;
}
/**
 * Inline panel section for selecting WMS styles.
 *
 * Displays available styles as cards within a collapsible section,
 * consistent with the raster function panel pattern.
 *
 * @param layerDetails - The legend layer to configure WMS styles for.
 * @returns A JSX element representing the WMS style panel.
 */
export declare function WmsStylePanel({ layerDetails }: WmsStylePanelProps): JSX.Element;
export {};
//# sourceMappingURL=wms-style-selector.d.ts.map