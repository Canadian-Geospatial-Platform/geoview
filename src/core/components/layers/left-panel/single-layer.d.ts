import { Dispatch, SetStateAction } from 'react';
import { TypeLegendLayer } from '@/core/components/layers/types';
interface SingleLayerProps {
    layer: TypeLegendLayer;
    depth: number;
    setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
    index: number;
    isFirst: boolean;
    isLast: boolean;
    isLayoutEnlarged: boolean;
}
export declare function SingleLayer({ depth, layer, setIsLayersListPanelVisible, index, isFirst, isLast, isLayoutEnlarged, }: SingleLayerProps): JSX.Element;
export {};
