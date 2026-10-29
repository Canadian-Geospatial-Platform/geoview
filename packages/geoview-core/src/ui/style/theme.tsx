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
 * @param mode - Display theme mode ('light', 'dark', 'geo.ca', or 'canada.ca')
 * @returns Fully configured MUI Theme object
 */
export const getTheme = (mode: TypeDisplayTheme): Theme => {
  const baseTheme = createTheme({ typography: { htmlFontSize: getCalibratedHtmlFontSize(), fontSize: 14 } });
  return createTheme(baseTheme, getThemeOptions(mode, { pxToRem: baseTheme.typography.pxToRem }));
};

/** Uncalibrated compatibility base; importing the default theme must not freeze document calibration before host CSS applies. */
const defaultBaseTheme = createTheme({ typography: { htmlFontSize: 16, fontSize: 14 } });

/** Default compatibility theme. Calibrated map themes are created lazily through getTheme instead. */
export const cgpvTheme = createTheme(defaultBaseTheme, getThemeOptions('geo.ca', { pxToRem: defaultBaseTheme.typography.pxToRem }));
