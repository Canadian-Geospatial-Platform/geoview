import type { TypeLegendLayer } from '@/core/components/layers/types';
interface LayerInfoPanelProps {
    layerDetails: TypeLegendLayer;
}
/**
 * Panel view for layer information content.
 *
 * Displays layer type, projection, bounds, active filters, temporal settings,
 * resource links, and metadata links. The header and back navigation are
 * handled by the parent.
 *
 * @param layerDetails - The legend layer to display information for.
 */
export declare function LayerInfoPanel({ layerDetails }: LayerInfoPanelProps): JSX.Element | null;
export {};
//# sourceMappingURL=layer-info.d.ts.map