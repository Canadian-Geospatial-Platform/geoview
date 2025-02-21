import { TypeLegendLayer } from '@/core/components/layers/types';
interface SingleLayerProps {
    layer: TypeLegendLayer;
    depth: number;
    showLayerDetailsPanel: (layerId: string) => void;
    isFirst: boolean;
    isLast: boolean;
    isLayoutEnlarged: boolean;
}
export declare function SingleLayer({ depth, layer, showLayerDetailsPanel, isFirst, isLast, isLayoutEnlarged }: SingleLayerProps): JSX.Element;
export {};
