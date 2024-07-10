import { Dispatch, SetStateAction } from 'react';
import { TypeLegendLayer } from '@/core/components/layers/types';
interface LayerListProps {
    depth: number;
    layersList: TypeLegendLayer[];
    setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
    isLayoutEnlarged: boolean;
}
export declare function LayersList({ layersList, setIsLayersListPanelVisible, isLayoutEnlarged, depth }: LayerListProps): JSX.Element;
export {};
