import { ReactNode } from 'react';
import { TypeContainerBox } from '@/core/types/global-types';
interface ResponsiveGridLayoutProps {
    leftTop?: ReactNode;
    leftMain?: ReactNode;
    rightTop?: ReactNode;
    guideContentIds?: string[];
    rightMain: ReactNode;
    fullWidth?: boolean;
    onIsEnlargeClicked?: (isEnlarge: boolean) => void;
    onGuideIsOpen?: (isGuideOpen: boolean) => void;
    hideEnlargeBtn?: boolean;
    containerType?: TypeContainerBox;
}
interface ResponsiveGridLayoutExposedMethods {
    setIsRightPanelVisible: (isVisible: boolean) => void;
    setRightPanelFocus: () => void;
}
declare const ResponsiveGridLayout: import("react").ForwardRefExoticComponent<ResponsiveGridLayoutProps & import("react").RefAttributes<ResponsiveGridLayoutExposedMethods>>;
export { ResponsiveGridLayout };
export type { ResponsiveGridLayoutExposedMethods };
//# sourceMappingURL=responsive-grid-layout.d.ts.map