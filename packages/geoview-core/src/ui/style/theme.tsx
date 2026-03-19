import type { Theme, ThemeOptions } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import type { TypeDisplayTheme } from '@/api/types/map-schema-types';
import { lightThemeColors } from '@/ui/style/light-theme';
import { darkThemeColors } from '@/ui/style/dark-theme';
import { geoCaThemeColors } from '@/ui/style/geo-ca-theme';
import { generateThemeOptions } from '@/ui/style/themeOptionsGenerator';

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    border: {
      primary: string;
    };
  }
}

/**
 * Resolves theme options based on display mode.
 *
 * @param mode - Display theme mode ('light', 'dark', or 'geo.ca')
 * @returns MUI ThemeOptions for the selected mode
 */
function getThemeOptions(mode: TypeDisplayTheme): ThemeOptions {
  switch (mode) {
    case 'dark':
      return generateThemeOptions(darkThemeColors);
    case 'geo.ca':
      return generateThemeOptions(geoCaThemeColors);
    default:
      return generateThemeOptions(lightThemeColors);
  }
}

/**
 * Creates a Material-UI theme for the given display mode.
 *
 * @param mode - Display theme mode ('light', 'dark', or 'geo.ca')
 * @returns Fully configured MUI Theme object
 */
export const getTheme = (mode: TypeDisplayTheme): Theme => {
  return createTheme(getThemeOptions(mode));
};

/** Default GeoView theme using the geo.ca color scheme */
export const cgpvTheme = getTheme('geo.ca');
