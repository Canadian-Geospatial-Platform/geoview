/// <reference types="react" />
import { TypeLegendLayer } from '@/core/components/layers/types';
interface LayerListProps {
    depth: number;
    layersList: TypeLegendLayer[];
    showLayerDetailsPanel: (layer: TypeLegendLayer) => void;
    isLayoutEnlarged: boolean;
}
export declare function LayersList({ layersList, showLayerDetailsPanel, isLayoutEnlarged, depth }: LayerListProps): JSX.Element;
export {};
