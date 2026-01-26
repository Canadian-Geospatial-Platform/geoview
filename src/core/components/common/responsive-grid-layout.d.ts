import type { ReactNode } from 'react';
import type { TypeContainerBox } from '@/core/types/global-types';
interface ResponsiveGridLayoutProps {
    leftTop?: ReactNode;
    leftMain?: ReactNode;
    rightTop?: ReactNode;
    guideContentIds?: string[];
    rightMain: ReactNode;
    onIsEnlargeClicked?: (isEnlarge: boolean) => void;
    onGuideIsOpen?: (isGuideOpen: boolean) => void;
    onRightPanelClosed?: () => void;
    onRightPanelVisibilityChanged?: (isVisible: boolean) => void;
    hideEnlargeBtn?: boolean;
    containerType?: TypeContainerBox;
    toggleMode?: boolean;
}
interface ResponsiveGridLayoutExposedMethods {
    setIsRightPanelVisible: (isVisible: boolean) => void;
    setRightPanelFocus: () => void;
    closeBtnRef?: React.RefObject<HTMLButtonElement>;
}
declare const ResponsiveGridLayout: import("react").ForwardRefExoticComponent<ResponsiveGridLayoutProps & import("react").RefAttributes<ResponsiveGridLayoutExposedMethods>>;
export { ResponsiveGridLayout };
export type { ResponsiveGridLayoutExposedMethods };
//# sourceMappingURL=responsive-grid-layout.d.ts.map