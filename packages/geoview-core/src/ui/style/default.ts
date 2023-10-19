import { ThemeOptions } from '@mui/material';

export const font = "'Roboto', 'Helvetica', 'Arial', sans-serif";

export const headingStyles = {
  fontFamily: font,
  fontWeight: 700,
};

export const opacity = {
  hoverOpacity: 0.08,
  selectedOpacity: 0.16,
  disabledOpacity: 0.38,
  focusOpacity: 0.12,
  activatedOpacity: 0.24,
};

export const defaultThemeOptions: ThemeOptions = {
  palette: {},
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
    btnHeight: '44px',
    btnWidth: '44px',
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
  footerPanel: {
    contentBg: '#F1F2F5 0% 0% no-repeat padding-box',
    contentShadow: 'inset 0px 3px 6px #00000029',
    titleFont: `normal normal 600 20px/27px ${font}`,
    layerTitleFont: `normal normal 600 18px/24px ${font}`,
    layerSecondaryTitleFont: `normal normal normal 16px/22px ${font}`,
    highlightColor: '#515BA5',
    featureNumbersFont: `normal normal normal 16px/22px ${font}`,
    featureKeyFont: `normal normal medium 16px/19px ${font}`,
    featureValueFont: `normal normal normal 16px/19px ${font}`,
    chooseLayerFont: `normal normal 600 16px/24px ${font}`,
  },
};
