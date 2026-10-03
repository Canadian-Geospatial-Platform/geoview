import type { Theme } from '@mui/material/styles';
type SxClasses = Record<string, object>;
/**
 * Generates the main SX classes for styling components.
 *
 * @param theme - The theme object, used for spacing values via `theme.spacing()`
 * @returns An object containing the style classes
 */
export declare const getSxClassesMain: (theme: Theme) => SxClasses;
/**
 * Get custom sx classes for the legend
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export declare const getSxClasses: (theme: Theme) => SxClasses;
export {};
//# sourceMappingURL=legend-styles.d.ts.map