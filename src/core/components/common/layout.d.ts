import type { ReactNode } from 'react';
import type { LayerListEntry } from './layer-list';
import type { TypeContainerBox } from '@/core/types/global-types';
interface LayoutProps {
    children?: ReactNode;
    layoutSwitch?: ReactNode;
    guideContentIds?: string[];
    layerList: LayerListEntry[];
    selectedLayerPath: string | undefined;
    fullWidth?: boolean;
    containerType?: TypeContainerBox;
    onLayerListClicked: (layer: LayerListEntry) => void;
    onIsEnlargeClicked?: (isEnlarge: boolean) => void;
    onGuideIsOpen?: (isGuideOpen: boolean) => void;
}
export declare function Layout({ children, layoutSwitch, guideContentIds, layerList, selectedLayerPath, onLayerListClicked, onIsEnlargeClicked, fullWidth, onGuideIsOpen, containerType, }: LayoutProps): JSX.Element;
export {};
//# sourceMappingURL=layout.d.ts.map