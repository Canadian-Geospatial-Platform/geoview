import type { TypeContainerBox } from '@/core/types/global-types';
export interface LegendLayerProps {
    layerPath: string;
    showControls: boolean;
    containerType: TypeContainerBox;
}
/**
 * Renders a layer entry in the legend with collapsible content.
 *
 * Triggers screen reader announcements when layer status changes between
 * loading/loaded/error states via ARIA live regions.
 */
export declare function LegendLayer({ layerPath, showControls, containerType }: LegendLayerProps): JSX.Element;
//# sourceMappingURL=legend-layer.d.ts.map