import { Theme, ThemeOptions, createTheme } from '@mui/material/styles';
import { TypeDisplayTheme } from '@/api/types/map-schema-types';
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

export const getTheme = (mode: TypeDisplayTheme): Theme => {
  return createTheme(getThemeOptions(mode));
};

export const cgpvTheme = getTheme('geo.ca');
