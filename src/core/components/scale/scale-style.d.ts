import type { Theme } from '@mui/material/styles';
import type { SxProps, SxStyles } from '@/ui/style/types';
/** Minimum width style for the scale container box. */
export declare const SCALE_BOX_STYLES: {
    readonly minWidth: 120;
};
/** Hides the radio circle visually but keeps it keyboard-accessible. */
export declare const getScaleRadioHiddenStyles: (theme: Theme) => SxProps<Theme>;
/** Styles for the FormControlLabel wrapping each scale radio option. */
export declare const getScaleFormControlLabelStyles: (theme: Theme) => SxProps<Theme>;
/**
 * Gets custom sx classes for the scale.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export declare const getSxClasses: (theme: Theme) => SxStyles;
//# sourceMappingURL=scale-style.d.ts.map