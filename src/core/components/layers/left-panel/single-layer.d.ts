import { Dispatch, SetStateAction } from 'react';
import { TypeLegendLayer } from '../types';
interface SingleLayerProps {
    layer: TypeLegendLayer;
    depth: number;
    isDragging: boolean;
    setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}
export declare function SingleLayer({ isDragging, depth, layer, setIsLayersListPanelVisible }: SingleLayerProps): JSX.Element;
export {};
