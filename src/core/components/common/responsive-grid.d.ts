import type { ReactNode } from 'react';
import type { GridProps, SxProps } from '@/ui';
/** Properties for the responsive grid root container. */
interface ResponsiveGridProps extends GridProps {
    children: ReactNode;
}
/** Properties for a responsive grid panel (left or right). */
interface ResponsiveGridPanelProps extends GridProps {
    children: ReactNode;
    isRightPanelVisible: boolean;
    sxProps?: SxProps;
    isEnlarged: boolean;
    className?: string;
    toggleMode?: boolean;
    ariaHidden?: boolean;
}
/** Responsive grid component with Root, Left, and Right panel slots. */
export declare const ResponsiveGrid: {
    Root: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridProps, "ref"> & import("react").RefAttributes<unknown>>;
    Left: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridPanelProps, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
    Right: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridPanelProps, "ref"> & import("react").RefAttributes<HTMLDivElement>>;
};
export {};
//# sourceMappingURL=responsive-grid.d.ts.map