import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
/** Sx class definitions for the north arrow component. */
interface NorthArrowStyles {
    /** Styles for the north arrow container. */
    northArrowContainer: SxProps<Theme>;
    /** Dimensions for the north arrow icon. */
    northArrow: {
        width?: number;
        height?: number;
    };
}
/**
 * Gets custom sx classes for the north arrow.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export declare const getSxClasses: (theme: Theme) => NorthArrowStyles;
export {};
//# sourceMappingURL=north-arrow-style.d.ts.map