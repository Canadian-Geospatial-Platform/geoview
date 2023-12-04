import { ReactNode } from 'react';
import { GridProps, SxProps } from '@/ui';
interface ResponsiveGridProps extends GridProps {
    children: ReactNode;
}
interface ResponsiveGridPanelProps extends GridProps {
    children: ReactNode;
    isLayersPanelVisible: boolean;
    sxProps?: SxProps | undefined;
    isEnlargeDataTable: boolean;
}
/**
 * Create Responsive Grid Container
 * @param {ReactNode} children children to be renderer
 * @returns JSX.Element
 */
declare function ResponsiveGridRoot({ children, ...rest }: ResponsiveGridProps): import("react").JSX.Element;
/**
 * Create Left Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @param {boolean} isEnlargeDataTable panel is enlarge
 * @returns JSX.Element
 */
declare function ResponsiveGridLeftPanel({ children, isLayersPanelVisible, sxProps, isEnlargeDataTable, ...rest }: ResponsiveGridPanelProps): import("react").JSX.Element;
declare namespace ResponsiveGridLeftPanel {
    var defaultProps: {
        sxProps: undefined;
    };
}
/**
 * Create Right Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @param {boolean} isEnlargeDataTable panel is enlarge
 * @param {object} sxProps Optional sx props
 * @returns JSX.Element
 */
declare function ResponsiveGridRightPanel({ children, isLayersPanelVisible, sxProps, isEnlargeDataTable, ...rest }: ResponsiveGridPanelProps): import("react").JSX.Element;
declare namespace ResponsiveGridRightPanel {
    var defaultProps: {
        sxProps: undefined;
    };
}
export declare const ResponsiveGrid: {
    Root: typeof ResponsiveGridRoot;
    Left: typeof ResponsiveGridLeftPanel;
    Right: typeof ResponsiveGridRightPanel;
};
export {};
