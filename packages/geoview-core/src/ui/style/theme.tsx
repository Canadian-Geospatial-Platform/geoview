import type { Theme, ThemeOptions } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import type { TypeDisplayTheme } from '@/api/types/map-schema-types';
import { lightThemeColors } from '@/ui/style/light-theme';
import { darkThemeColors } from '@/ui/style/dark-theme';
import { geoCaThemeColors } from '@/ui/style/geo-ca-theme';
import { canadaCaThemeColors, canadaCaThemeFont } from '@/ui/style/canada-ca-theme';
import { generateThemeOptions } from '@/ui/style/themeOptionsGenerator';
import { font } from '@/ui/style/default';

/**
 * Resolves theme options based on display mode.
 *
 * @param mode - Display theme mode ('light', 'dark', 'geo.ca', or 'canada.ca')
 * @returns MUI ThemeOptions for the selected mode
 */
function getThemeOptions(mode: TypeDisplayTheme): ThemeOptions {
  switch (mode) {
    case 'dark':
      return generateThemeOptions(darkThemeColors, font, 'dark');
    case 'canada.ca':
      return generateThemeOptions(canadaCaThemeColors, canadaCaThemeFont, 'light');
    case 'geo.ca':
      return generateThemeOptions(geoCaThemeColors, font, 'light');
    default:
      return generateThemeOptions(lightThemeColors, font, 'light');
  }
}

/**
 * Creates a Material-UI theme for the given display mode.
 *
 * @param mode - Display theme mode ('light', 'dark', 'geo.ca', or 'canada.ca')
 * @returns Fully configured MUI Theme object
 */
export const getTheme = (mode: TypeDisplayTheme): Theme => {
  return createTheme(getThemeOptions(mode));
};

/** Default GeoView theme using the geo.ca color scheme. */
export const cgpvTheme = getTheme('geo.ca');
