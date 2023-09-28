import { ThemeOptions } from '@mui/material';
import { defaultThemeOptions, opacity } from './default';

/**
 * Make changes to MUI default LIGHT theme/mode here
 * see https://mui.com/material-ui/customization/palette/
 */
const royalPalette = {
  primary: {
    light: '#c8cde4',
    main: '#515BA5',
    dark: '##2e2e6c',
    contrastText: '#ffffff',
  },
  secondary: {
    light: '#42a5f5',
    main: '#1976d2',
    dark: '#1565c0',
    contrastText: '#000',
  },
  backdrop: '#3F3F3F50',
  common: {
    black: '#000',
    white: '#fff',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
    contrastText: '#fff',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
    contrastText: '#fff',
  },
  info: {
    main: '#0288d1',
    light: '#03a9f4',
    dark: '#01579b',
    contrastText: '#fff',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
    contrastText: '#fff',
  },
  grey: {
    '50': '#fafafa',
    '100': '#f5f5f5',
    '200': '#eeeeee',
    '300': '#e0e0e0',
    '400': '#bdbdbd',
    '500': '#9e9e9e',
    '600': '#757575',
    '700': '#616161',
    '800': '#424242',
    '900': '#212121',
    A100: '#f5f5f5',
    A200: '#eeeeee',
    A400: '#bdbdbd',
    A700: '#616161',
  },
  contrastThreshold: 3,
  tonalOffset: 0.2,
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
  background: {
    paper: '#fff',
    default: '#fff',
    grey: '#eeeeee',
  },
  action: {
    active: 'rgba(81,91,165, 0.94)',
    hover: `rgba(81,91,165, ${opacity.hoverOpacity})`,
    hoverOpacity: opacity.hoverOpacity,
    selected: `rgba(81,91,165, ${opacity.selectedOpacity})`,
    selectedOpacity: opacity.selectedOpacity,
    hoverRow: `rgba(0, 255, 255, ${opacity.hoverOpacity})`,
    selectedRow: `rgba(0, 255, 255, ${opacity.selectedOpacity})`,
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: `rgba(0, 0, 0, ${opacity.focusOpacity})`,
    disabledOpacity: opacity.disabledOpacity,
    focus: `rgba(0, 0, 0, ${opacity.focusOpacity})`,
    focusOpacity: opacity.focusOpacity,
    activatedOpacity: opacity.activatedOpacity,
  },
  border: {
    primary: 'rgba(0, 0, 0, 0.87)',
  },
};

export const royalThemeOptions: ThemeOptions = {
  ...defaultThemeOptions,
  palette: royalPalette,
};
