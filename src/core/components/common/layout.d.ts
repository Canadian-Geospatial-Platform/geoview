import { type ReactNode } from 'react';
import { LayerListEntry } from './layer-list';
interface LayoutProps {
    children?: ReactNode;
    layerList: LayerListEntry[];
    selectedLayerPath: string | undefined;
    onLayerListClicked: (layer: LayerListEntry) => void;
    onIsEnlargeClicked?: (isEnlarge: boolean) => void;
    fullWidth?: boolean;
}
export declare function Layout({ children, layerList, selectedLayerPath, onLayerListClicked, onIsEnlargeClicked, fullWidth }: LayoutProps): import("react").JSX.Element;
export declare namespace Layout {
    var defaultProps: {
        children: null;
        onIsEnlargeClicked: undefined;
        fullWidth: boolean;
    };
}
export {};
