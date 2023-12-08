import { type ReactNode } from 'react';
import { LayerListEntry } from './layer-list';
interface LayoutProps {
    children?: ReactNode;
    layerList: LayerListEntry[];
    selectedLayerPath: string;
    handleLayerList: (layer: LayerListEntry) => void;
}
export declare function Layout({ children, layerList, handleLayerList, selectedLayerPath }: LayoutProps): import("react").JSX.Element;
export declare namespace Layout {
    var defaultProps: {
        children: null;
    };
}
export {};
