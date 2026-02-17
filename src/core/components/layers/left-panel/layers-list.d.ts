import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeContainerBox } from '@/core/types/global-types';
interface LayerListProps {
    depth: number;
    layersList: TypeLegendLayer[];
    showLayerDetailsPanel: (layerId: string) => void;
    isLayoutEnlarged: boolean;
    containerType: TypeContainerBox;
}
export declare function LayersList({ layersList, showLayerDetailsPanel, isLayoutEnlarged, depth, containerType }: LayerListProps): JSX.Element;
export {};
//# sourceMappingURL=layers-list.d.ts.map