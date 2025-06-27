import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';
interface NorthArrowStyles {
    northArrowContainer: SxProps<Theme>;
    northArrow: {
        width?: number;
        height?: number;
    };
}
/**
 * Get custom sx classes for the north arrow
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export declare const getSxClasses: (theme: Theme) => NorthArrowStyles;
export {};
//# sourceMappingURL=north-arrow-style.d.ts.map