import { createTheme } from '@mui/material/styles';
import { lightThemeOptions } from './light-theme';
import { darkThemeOptions } from './dark-theme';
import { royalThemeOptions } from './royal-theme';

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    border: {
      primary: string;
    };
  }
}

function getThemeOptions(mode: string | undefined) {
  switch (mode) {
    case 'dark':
      return darkThemeOptions;
    case 'royal':
      return royalThemeOptions;
    default:
      return lightThemeOptions;
  }
}

export const getTheme = (mode: 'light' | 'dark' | 'royal' | undefined) => {
  const optionClone = getThemeOptions(mode);

  return createTheme(optionClone);
};

export const cgpvTheme = createTheme(getThemeOptions(undefined));
