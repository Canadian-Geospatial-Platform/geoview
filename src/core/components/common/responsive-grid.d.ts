import { ReactNode } from 'react';
import { GridProps, SxProps } from '@/ui';
interface ResponsiveGridProps extends GridProps {
    children: ReactNode;
}
interface ResponsiveGridPanelProps extends GridProps {
    children: ReactNode;
    isRightPanelVisible: boolean;
    sxProps?: SxProps | undefined;
    isEnlarged: boolean;
    fullWidth?: boolean;
    className?: string;
}
export declare const ResponsiveGrid: {
    Root: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridProps, "ref"> & import("react").RefAttributes<unknown>>;
    Left: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridPanelProps, "ref"> & import("react").RefAttributes<unknown>>;
    Right: import("react").ForwardRefExoticComponent<Omit<ResponsiveGridPanelProps, "ref"> & import("react").RefAttributes<unknown>>;
};
export {};
