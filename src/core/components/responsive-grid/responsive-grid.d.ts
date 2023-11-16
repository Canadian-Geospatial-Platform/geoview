import { ReactNode } from 'react';
import { GridProps } from '@mui/material';
interface ResponsiveGridProps extends GridProps {
    children: ReactNode;
}
interface ResponsiveGridPanelProps extends GridProps {
    children: ReactNode;
    isLayersPanelVisible: boolean;
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
 * @returns JSX.Element
 */
declare function ResponsiveGridLeftPanel({ children, isLayersPanelVisible, ...rest }: ResponsiveGridPanelProps): import("react").JSX.Element;
/**
 * Create Right Panel for responsive grid.
 * @param {ReactNode} children child elements to be rendered
 * @param {boolean} isLayersPanelVisible panel visibility
 * @returns JSX.Element
 */
declare function ResponsiveGridRightPanel({ children, isLayersPanelVisible, ...rest }: ResponsiveGridPanelProps): import("react").JSX.Element;
export declare const ResponsiveGrid: {
    Root: typeof ResponsiveGridRoot;
    Left: typeof ResponsiveGridLeftPanel;
    Right: typeof ResponsiveGridRightPanel;
};
export {};
