import { Dispatch, SetStateAction } from 'react';
interface LayerListProps {
    setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}
export declare function LayersList({ setIsLayersListPanelVisible }: LayerListProps): JSX.Element;
export {};
