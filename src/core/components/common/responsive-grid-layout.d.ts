import React, { ReactNode } from 'react';
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
declare const ResponsiveGridLayout: React.ForwardRefExoticComponent<ResponsiveGridLayoutProps & React.RefAttributes<ResponsiveGridLayoutExposedMethods>>;
export { ResponsiveGridLayout };
export type { ResponsiveGridLayoutExposedMethods };
