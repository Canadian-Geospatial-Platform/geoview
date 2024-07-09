import { Dispatch, SetStateAction } from 'react';
interface LeftPanelProps {
    setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
    isLayoutEnlarged: boolean;
}
export declare function LeftPanel({ setIsLayersListPanelVisible, isLayoutEnlarged }: LeftPanelProps): JSX.Element;
export {};
