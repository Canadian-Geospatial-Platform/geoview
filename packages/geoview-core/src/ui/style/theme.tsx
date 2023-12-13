import { createTheme } from '@mui/material/styles';
import { lightThemeOptions } from './light-theme';
import { darkThemeOptions } from './dark-theme';
import { geoCaThemeOptions } from './geo-ca-theme';
import { TypeDisplayTheme } from '@/geo/map/map-schema-types';

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    border: {
      primary: string;
    };
  }
}

function getThemeOptions(mode: TypeDisplayTheme) {
  switch (mode) {
    case 'dark':
      return darkThemeOptions;
    case 'geo.ca':
      return geoCaThemeOptions;
    default:
      return lightThemeOptions;
  }
}

export const getTheme = (mode: TypeDisplayTheme) => {
  const optionClone = getThemeOptions(mode);

  return createTheme(optionClone);
};

export const cgpvTheme = createTheme(getThemeOptions('geo.ca'));
