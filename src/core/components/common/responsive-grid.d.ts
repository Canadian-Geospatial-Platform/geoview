import type { ReactNode } from 'react';
import type { GridProps, SxProps } from '@/ui';
interface ResponsiveGridProps extends GridProps {
    children: ReactNode;
}
interface ResponsiveGridPanelProps extends GridProps {
    children: ReactNode;
    isRightPanelVisible: boolean;
    sxProps?: SxProps;
    isEnlarged: boolean;
    className?: string;
    toggleMode?: boolean;
}
export declare const ResponsiveGrid: {
    Root: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridProps, "ref"> & import("react").RefAttributes<unknown>>;
    Left: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridPanelProps, "ref"> & import("react").RefAttributes<unknown>>;
    Right: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridPanelProps, "ref"> & import("react").RefAttributes<unknown>>;
};
export {};
//# sourceMappingURL=responsive-grid.d.ts.map