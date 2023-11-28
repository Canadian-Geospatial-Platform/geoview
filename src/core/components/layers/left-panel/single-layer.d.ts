import { Dispatch, SetStateAction } from 'react';
import { TypeLegendLayer } from '../types';
interface SingleLayerProps {
    layer: TypeLegendLayer;
    depth: number;
    setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>> | undefined;
}
export declare function SingleLayer(props: SingleLayerProps): JSX.Element;
export {};
