import { TypeLegendLayer } from '@/core/components/layers/types';
interface LayerListProps {
    depth: number;
    layersList: TypeLegendLayer[];
    showLayerDetailsPanel: (layerId: string) => void;
    isLayoutEnlarged: boolean;
}
export declare function LayersList({ layersList, showLayerDetailsPanel, isLayoutEnlarged, depth }: LayerListProps): JSX.Element;
export {};
//# sourceMappingURL=layers-list.d.ts.map