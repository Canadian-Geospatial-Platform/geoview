import type { Theme } from '@mui/material/styles';
type SxClasses = Record<string, object>;
/**
 * Generates the main SX classes for styling components
 * @returns {SxClasses} An object containing the style classes
 */
export declare const getSxClassesMain: () => SxClasses;
/**
 * Get custom sx classes for the legend
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export declare const getSxClasses: (theme: Theme) => SxClasses;
export {};
//# sourceMappingURL=legend-styles.d.ts.map