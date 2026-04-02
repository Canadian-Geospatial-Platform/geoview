import type { ReactNode } from 'react';
import type { TypeContainerBox } from '@/core/types/global-types';
/** Properties for the ResponsiveGridLayout component. */
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
    containerType: TypeContainerBox;
    titleFullscreen: string;
    toggleMode?: boolean;
}
/** Methods exposed by the ResponsiveGridLayout component via ref. */
interface ResponsiveGridLayoutExposedMethods {
    setIsRightPanelVisible: (isVisible: boolean) => void;
    setRightPanelFocus: () => void;
    closeBtnRef?: React.RefObject<HTMLButtonElement>;
}
/**
 * Two-panel responsive grid layout with guide, enlarge, and fullscreen support.
 *
 * @param props - ResponsiveGridLayout properties
 * @param ref - Ref exposing panel visibility and focus methods
 * @returns The responsive grid layout element
 */
declare const ResponsiveGridLayout: import("react").ForwardRefExoticComponent<ResponsiveGridLayoutProps & import("react").RefAttributes<ResponsiveGridLayoutExposedMethods>>;
export { ResponsiveGridLayout };
export type { ResponsiveGridLayoutExposedMethods };
//# sourceMappingURL=responsive-grid-layout.d.ts.map