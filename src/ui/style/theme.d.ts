import type { Theme } from '@mui/material/styles';
import type { TypeDisplayTheme } from '@/api/types/map-schema-types';
/**
 * Creates a Material-UI theme for the given display mode.
 *
 * `baseTheme` exists only so we can read its calibrated `pxToRem`, used to convert our font
 * sizes to rem. The real theme is then created in a single `createTheme` call from the
 * generated options (plus `htmlFontSize`) - we never pass `baseTheme` itself into that call.
 * Doing so would merge our options onto an already-built theme, and MUI only overrides the
 * specific properties we set. Anything we don't explicitly set (e.g. font family on body/button
 * text, divider/disabled colours in dark mode, or the 640/960px breakpoints) would silently
 * fall back to `baseTheme`'s defaults instead of ours.
 *
 * @param mode - Display theme mode ('light', 'dark', 'geo.ca', or 'canada.ca')
 * @returns Fully configured MUI Theme object
 */
export declare const getTheme: (mode: TypeDisplayTheme) => Theme;
/** @deprecated Use the owning map's theme via useTheme(), or getTheme(mode) to build one; removed in a future breaking release */
export declare const cgpvTheme: Theme;
//# sourceMappingURL=theme.d.ts.map