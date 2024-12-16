import { ReactNode } from 'react';
import { LayerListEntry } from './layer-list';
import { TypeContainerBox } from '@/core/types/global-types';
interface LayoutProps {
    children?: ReactNode;
    guideContentIds?: string[];
    layerList: LayerListEntry[];
    selectedLayerPath: string | undefined;
    fullWidth?: boolean;
    containerType?: TypeContainerBox;
    onLayerListClicked: (layer: LayerListEntry) => void;
    onIsEnlargeClicked?: (isEnlarge: boolean) => void;
    onGuideIsOpen?: (isGuideOpen: boolean) => void;
}
export declare const Layout: import("react").NamedExoticComponent<LayoutProps>;
export {};
