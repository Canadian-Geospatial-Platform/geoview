import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
/** Theme-independent top-panel styles, passed as objects to ResponsiveGrid panels. */
export declare const TOP_PANEL_STYLES: {
    left: {
        zIndex: number;
    };
    right: {
        zIndex: number;
        alignContent: "flex-end";
    };
    leftFullscreen: {
        zIndex: string;
    };
    rightFullscreen: {
        zIndex: string;
        alignContent: "flex-end";
    };
};
/**
 * Gets custom sx classes for the common grid layout.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export declare const getSxClasses: (theme: Theme) => SxStyles;
//# sourceMappingURL=responsive-grid-layout-style.d.ts.map