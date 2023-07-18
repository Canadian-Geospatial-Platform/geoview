import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    border: {
      primary: string;
    };
  }
}

const font = "'Roboto', 'Helvetica', 'Arial', sans-serif";

const headingStyles = {
  fontFamily: font,
  fontWeight: 700,
};

const opacity = {
  hoverOpacity: 0.08,
  selectedOpacity: 0.16,
  disabledOpacity: 0.38,
  focusOpacity: 0.12,
  activatedOpacity: 0.24,
};

/**
 * Make changes to MUI default LIGHT theme/mode here
 * see https://mui.com/material-ui/customization/palette/
 */
const lightPalette = {
  primary: {
    light: '#ffffff',
    main: '#808080',
    dark: '#232323',
    contrastText: '#666666',
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
    active: 'rgba(0, 0, 0, 0.54)',
    hover: `rgba(0, 0, 0, ${opacity.hoverOpacity})`,
    hoverOpacity: opacity.hoverOpacity,
    selected: `rgba(0, 0, 0, ${opacity.selectedOpacity})`,
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

/**
 * Make changes to MUI default DARK theme/mode here
 * see https://mui.com/material-ui/customization/palette/
 */
const darkPalette = {
  common: {
    black: '#000',
    white: '#fff',
  },
  primary: {
    main: '#90caf9',
    light: '#e3f2fd',
    dark: '#42a5f5',
    contrastText: 'rgba(0, 0, 0, 0.87)',
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

const themeOptions: ThemeOptions = {
  palette: lightPalette,
  typography: {
    fontSize: 16,
    htmlFontSize: 16,
    fontFamily: font,
    h1: headingStyles,
    h2: headingStyles,
    h3: headingStyles,
    h4: headingStyles,
    h5: headingStyles,
    h6: {
      fontWeight: 400,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.25,
    },
    subtitle2: {
      fontSize: '0.8rem',
      lineHeight: 1.25,
    },
    body1: {},
    body2: {},
    caption: {},
    overline: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: 2,
    },
    button: {
      fontSize: 24,
      fontWeight: 500,
    },
    control: {
      fontSize: 11,
      fontWeight: 500,
    },
  },
  // based on recommendation - https://github.com/mui/material-ui/issues/29677
  // will resolve the spacing issues of data grid
  spacing: (factor: number) => {
    const values = [0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 15, 16, 18, 20, 30];
    const index = Math.floor(factor);
    const currentSpace = values[index];
    const nextSpace = values[index + 1] || currentSpace * 2;
    const space = currentSpace + (nextSpace - currentSpace) * (factor - index);
    return `${space}px`;
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 640,
      md: 960,
      lg: 1200,
      xl: 1536,
    },
  },
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 15000,
    olControl: 500,
    focusDialog: 1300,
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      // most basic recommended timing
      standard: 300,
      // this is to be used in complex animations
      complex: 375,
      // recommended when something is entering screen
      enteringScreen: 225,
      // recommended when something is leaving screen
      leavingScreen: 195,
      splash: 1500,
    },
    easing: {
      // This is the most common easing curve.
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Objects enter the screen at full velocity from off-screen and
      // slowly decelerate to a resting point.
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      // Objects leave the screen at full velocity. They do not decelerate when off-screen.
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      // The sharp curve is used by objects that may return to the screen at any time.
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  shape: {
    borderRadius: 6,
    center: '50%',
    right: '100%',
    left: '0%',
  },
  components: {
    MuiFab: {
      styleOverrides: {
        root: { padding: '0 24px' },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { position: 'relative' },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        grouped: {
          minWidth: 'auto',
        },
      },
    },
    MuiListItemButton: {
      defaultProps: {
        disableTouchRipple: true,
      },
    },
  },
  overrides: {
    button: {
      size: { width: '32px', height: '32px' },
    },
    northArrow: {
      size: { width: 42, height: 42 },
    },
    crosshairIcon: {
      size: { width: 275, height: 275 },
    },
  },
  iconImg: {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: '#757575',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
    objectFit: 'scale-down',
  },
  appBar: {
    background: '#FFFFFFee',
    border: '1px solid #bdbbdb',
    btnActiveBg: '#000000e6',
    btnDefaultBg: '#222222',
    btnFocusBg: '#333333',
    btnHoverBg: '#666666',
  },
  navBar: {
    borderColor: '#bdbbdb',
    btnActiveBg: '#ffffff',
    btnDefaultBg: '#ffffff',
    btnFocusBg: '#ffffff',
    btnHoverBg: '#f2f2f2',
    btnActiveColor: '#393939',
    btnDefaultColor: '#393939',
    btnFocusColor: '#393939',
    btnHoverColor: '#393939',
  },
  panel: {
    background: '#fff',
    border: '#393939',
    borderLight: '#4f4f4f',
    defaultBg: '#232323',
    hoverBg: '#393939',
    activeBg: '#4f4f4f',
  },
  basemapPanel: {
    header: '#ffffff',
    borderDefault: 'rgba(255,255,255,0.25)',
    borderHover: 'rgba(255,255,255,0.5)',
    borderActive: 'rgba(255,255,255,0.75)',
    overlayDefault: 'rgba(0,0,0,0.5)',
    overlayHover: 'rgba(0,0,0,0.25)',
    overlayActive: 'transparent',
  },
};

export const getTheme = (mode: 'light' | 'dark' | undefined) => {
  const optionClone = { ...themeOptions };
  if (mode === 'dark') {
    optionClone.palette = darkPalette;
    optionClone.appBar = darkAppBar;
    optionClone.panel = darkPanel;
    optionClone.palette.mode = mode;
  }
  return createTheme(optionClone);
};

export const cgpvTheme = createTheme(themeOptions);
