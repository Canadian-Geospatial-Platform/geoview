import { Theme, ThemeOptions, createTheme } from '@mui/material/styles';
import { TypeDisplayTheme } from '@/api/config/types/map-schema-types';
import { lightThemeColors } from './light-theme';
import { darkThemeColors } from './dark-theme';
import { geoCaThemeColors } from './geo-ca-theme';
import { generateThemeOptions } from './themeOptionsGenerator';

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
  const optionClone = getThemeOptions(mode);

  return createTheme(optionClone);
};

export const cgpvTheme = createTheme(getThemeOptions('geo.ca'));
