import type { ThemeOptions } from '@mui/material';
import type { CSSObject } from '@mui/system';
import type { IGeoViewColors } from '@/ui/style/types';
/** WCAG 2.1 SC 2.4.7 compliant focus indicator outline width. */
export declare const FOCUS_OUTLINE_WIDTH = "3px";
/** Focus indicator outline offset distance from element boundary. */
export declare const FOCUS_OUTLINE_OFFSET = "2px";
/** Focus indicator halo (box-shadow) size for enhanced visibility. */
export declare const FOCUS_HALO_SIZE = "6px";
/**
 * WCAG-compliant focus indicator styles for keyboard navigation.
 *
 * Returns a CSSObject for use in MUI component styleOverrides.
 * Component-level application is required because MUI's ButtonBase sets outline: 0
 * with higher CSS specificity than CssBaseline global styles.
 *
 * @param geoViewColors - GeoView color palette for focus indicator colors
 * @returns Focus indicator style object for .Mui-focusVisible selector
 */
export declare const getFocusIndicatorStyles: (geoViewColors: IGeoViewColors) => CSSObject;
/**
 * WCAG-compliant focus indicator styles for InputBase-derived form controls.
 *
 * Reuses getFocusIndicatorStyles' outline but drops the box-shadow halo, since form controls
 * render their own border/underline and the halo was visually redundant.
 *
 * @param geoViewColors - GeoView color palette for focus indicator colors
 * @returns Focus indicator style object (no halo) for use with :has(:focus-visible) on the input root
 */
export declare const getFormControlFocusIndicatorStyles: (geoViewColors: IGeoViewColors) => CSSObject;
/**
 * Generates complete MUI ThemeOptions from a GeoView color palette.
 *
 * Configures all MUI component overrides, typography, palette, and spacing
 * to match GeoView's design system.
 *
 * @param geoViewColors - Optional color palette to generate theme from
 * @param themeFont - Optional font family stack to apply to the generated theme
 * @returns Complete MUI ThemeOptions configuration
 */
export declare const generateThemeOptions: (geoViewColors?: IGeoViewColors, themeFont?: string) => ThemeOptions;
//# sourceMappingURL=themeOptionsGenerator.d.ts.map