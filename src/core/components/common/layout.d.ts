import type { ReactNode } from 'react';
import type { LayerListEntry } from './layer-list';
import type { TypeContainerBox } from '@/core/types/global-types';
interface LayoutProps {
    children?: ReactNode;
    layoutSwitch?: ReactNode;
    guideContentIds?: string[];
    layerList: LayerListEntry[];
    selectedLayerPath: string | undefined;
    onLayerListClicked: (layer: LayerListEntry) => void;
    onIsEnlargeClicked?: (isEnlarge: boolean) => void;
    onGuideIsOpen?: (isGuideOpen: boolean) => void;
    onRightPanelClosed?: () => void;
    onRightPanelVisibilityChanged?: (isVisible: boolean) => void;
    containerType?: TypeContainerBox;
    hideEnlargeBtn?: boolean;
    toggleMode?: boolean;
}
interface LayoutExposedMethods {
    showRightPanel: (visible: boolean) => void;
}
declare const Layout: import("react").ForwardRefExoticComponent<LayoutProps & import("react").RefAttributes<LayoutExposedMethods>>;
export { Layout };
export type { LayoutExposedMethods };
//# sourceMappingURL=layout.d.ts.map