import { ThemeOptions } from '@mui/material';
import { defaultThemeOptions, opacity, geoViewColors as defaultGeoViewColors } from './default';
import { GeoViewWCAGColor, IGeoViewColors } from './geoView.interface';

/**
 * Make changes to MUI default DARK theme/mode here
 * see https://mui.com/material-ui/customization/palette/
 */

const geoViewColors: IGeoViewColors = {
  ...defaultGeoViewColors,

  bgColor: {
    main: '#3C3E42',
    light: '#232323',
    lighter: '#393939',
    lightest: '#4f4f4f',
    dark: '#000000',
    darker: '#000000',
    darkest: '#000000',
  },
  
  primary: new GeoViewWCAGColor('#515BA5'),
  textColor: new GeoViewWCAGColor('#ffffff'),

  subtleText: '#d8d8d8',
  layersRoundButtonsBg: '#393939',
};

const darkPalette = {
  ...defaultThemeOptions.palette,
  geoViewColors,
  common: {
    black: '#101010',
    white: '#fff',
  },
  primary: {
    light: '#c8cde4',
    main: '#515BA5',
    dark: '#2e2e6c',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#ce93d8',
    light: '#f3e5f5',
    dark: '#ab47bc',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  backdrop: '#3F3F3F50',
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
    contrastText: '#fff',
  },
  warning: {
    main: '#ffa726',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  info: {
    main: '#29b6f6',
    light: '#4fc3f7',
    dark: '#0288d1',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  success: {
    main: '#66bb6a',
    light: '#81c784',
    dark: '#388e3c',
    contrastText: 'rgba(0, 0, 0, 0.87)',
  },
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    A100: '#f5f5f5',
    A200: '#eeeeee',
    A400: '#bdbdbd',
    A700: '#616161',
  },
  contrastThreshold: 3,
  tonalOffset: 0.2,
  text: {
    primary: '#fff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
    icon: 'rgba(255, 255, 255, 0.5)',
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  background: {
    paper: '#121212',
    default: '#232323',
    grey: '#121212',
  },
  action: {
    active: '#fff',
    hover: `rgba(255, 255, 255, ${opacity.hoverOpacity})`,
    hoverOpacity: opacity.hoverOpacity,
    selected: `rgba(255, 255, 255, ${opacity.selectedOpacity})`,
    selectedOpacity: opacity.selectedOpacity,
    hoverRow: `rgba(0, 255, 255, ${opacity.hoverOpacity})`,
    selectedRow: `rgba(0, 255, 255, ${opacity.selectedOpacity})`,
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: `rgba(255, 255, 255, ${opacity.focusOpacity})`,
    disabledOpacity: opacity.disabledOpacity,
    focus: `rgba(255, 255, 255, ${opacity.focusOpacity})`,
    focusOpacity: opacity.focusOpacity,
    activatedOpacity: opacity.activatedOpacity,
  },
  border: {
    primary: '#fff',
  },
};

const darkAppBar = {
  background: '#000000dd',
  border: '#444444',
  btnActiveBg: '#ffffffe6',
  btnDefaultBg: '#222222',
  btnFocusBg: '#333333',
  btnHoverBg: '#666666',
};

const darkPanel = {
  background: '#000000dd',
  border: '#393939',
  borderLight: '#4f4f4f',
  defaultBg: '#232323',
  hoverBg: '#393939',
  activeBg: '#4f4f4f',
};

export const darkThemeOptions: ThemeOptions = {
  ...defaultThemeOptions,
  palette: darkPalette,
  appBar: darkAppBar,
  panel: darkPanel,
};
