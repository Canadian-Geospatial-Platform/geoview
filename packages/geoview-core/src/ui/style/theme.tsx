import type { Theme, ThemeOptions } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import type { TypeDisplayTheme } from '@/api/types/map-schema-types';
import { lightThemeColors } from '@/ui/style/light-theme';
import { darkThemeColors } from '@/ui/style/dark-theme';
import { geoCaThemeColors } from '@/ui/style/geo-ca-theme';
import { canadaCaThemeColors, canadaCaThemeFont } from '@/ui/style/canada-ca-theme';
import { generateThemeOptions } from '@/ui/style/themeOptionsGenerator';
import { font } from '@/ui/style/default';
import type { ThemeTypographyInput } from '@/ui/style/types';
import { getCalibratedHtmlFontSize } from '@/ui/style/typography-calibration';

/**
 * Resolves theme options based on display mode.
 *
 * @param mode - Display theme mode ('light', 'dark', 'geo.ca', or 'canada.ca')
 * @param typography - Base-theme conversion and optional scale-key overrides for the selected theme
 * @returns MUI ThemeOptions for the selected mode
 */
function getThemeOptions(mode: TypeDisplayTheme, typography: ThemeTypographyInput): ThemeOptions {
  switch (mode) {
    case 'dark':
      return generateThemeOptions({ geoViewColors: darkThemeColors, themeFont: font, mode: 'dark', typography });
    case 'canada.ca':
      return generateThemeOptions({ geoViewColors: canadaCaThemeColors, themeFont: canadaCaThemeFont, mode: 'light', typography });
    case 'geo.ca':
      return generateThemeOptions({ geoViewColors: geoCaThemeColors, themeFont: font, mode: 'light', typography });
    default:
      return generateThemeOptions({ geoViewColors: lightThemeColors, themeFont: font, mode: 'light', typography });
  }
}

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
export const getTheme = (mode: TypeDisplayTheme): Theme => {
  const htmlFontSize = getCalibratedHtmlFontSize();
  const baseTheme = createTheme({ typography: { htmlFontSize, fontSize: 14 } });
  const themeOptions = getThemeOptions(mode, { pxToRem: baseTheme.typography.pxToRem });
  return createTheme({ ...themeOptions, typography: { ...themeOptions.typography, htmlFontSize } });
};

/** Uncalibrated compatibility base; importing the default theme must not freeze document calibration before host CSS applies. */
const defaultHtmlFontSize = 16;
const defaultBaseTheme = createTheme({ typography: { htmlFontSize: defaultHtmlFontSize, fontSize: 14 } });

/** Default compatibility theme. Calibrated map themes are created lazily through getTheme instead. */
const cgpvThemeOptions = getThemeOptions('geo.ca', { pxToRem: defaultBaseTheme.typography.pxToRem });
/** @deprecated Use the owning map's theme via useTheme(), or getTheme(mode) to build one; removed in a future breaking release */
export const cgpvTheme = createTheme({
  ...cgpvThemeOptions,
  typography: { ...cgpvThemeOptions.typography, htmlFontSize: defaultHtmlFontSize },
});
