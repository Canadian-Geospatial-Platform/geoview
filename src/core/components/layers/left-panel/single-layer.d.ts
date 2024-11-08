import { TypeLegendLayer } from '@/core/components/layers/types';
interface SingleLayerProps {
    layer: TypeLegendLayer;
    depth: number;
    showLayerDetailsPanel: (layer: TypeLegendLayer) => void;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    isLayoutEnlarged: boolean;
}
export declare function SingleLayer({ depth, layer, showLayerDetailsPanel, index, isFirst, isLast, isLayoutEnlarged, }: SingleLayerProps): JSX.Element;
export {};
