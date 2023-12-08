import { Dispatch, SetStateAction } from 'react';
import { TypeLegendLayer } from '../types';
interface LayerListProps {
    depth: number;
    parentLayerPath: string;
    layersList: TypeLegendLayer[];
    setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}
export declare function LayersList({ layersList, setIsLayersListPanelVisible, parentLayerPath, depth }: LayerListProps): JSX.Element;
export {};
