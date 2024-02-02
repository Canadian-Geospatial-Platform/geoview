import { ThemeOptions } from '@mui/material';
import { IGeoViewColors } from './types';
import { font, headingStyles, opacity, geoViewColors as defaultGeoViewColors, defaultFontSize, geoViewFontSizes } from './default';

export const generateThemeOptions = function (geoViewColors: IGeoViewColors = defaultGeoViewColors): ThemeOptions {
  const themeOptions: ThemeOptions = {
    palette: {
      geoViewColor: geoViewColors,
      geoViewFontSize: geoViewFontSizes,
      geoViewSpacingAndSizing: {},
      backdrop: '#3F3F3F50',
      common: {
        black: '#000',
        white: '#fff',
      },
      primary: {
        main: geoViewColors.primary.main,
        light: geoViewColors.primary.light[600],
        dark: geoViewColors.primary.dark[200],
        contrastText: geoViewColors.primary.contrastText(),
      },
      secondary: {
        main: geoViewColors.primary.main,
        light: geoViewColors.primary.light[600],
        dark: geoViewColors.primary.dark[300],
        contrastText: geoViewColors.primary.contrastText(),
      },
      error: {
        main: geoViewColors.error.main,
        light: geoViewColors.error.light[600],
        dark: geoViewColors.error.dark[300],
        contrastText: geoViewColors.error.contrastText(),
      },
      warning: {
        main: geoViewColors.warning.main,
        light: geoViewColors.warning.light[600],
        dark: geoViewColors.warning.dark[300],
        contrastText: geoViewColors.warning.contrastText(),
      },
      info: {
        main: geoViewColors.info.main,
        light: geoViewColors.info.light[600],
        dark: geoViewColors.info.dark[300],
        contrastText: geoViewColors.info.contrastText(),
      },
      success: {
        main: geoViewColors.success.main,
        light: geoViewColors.success.light[600],
        dark: geoViewColors.success.dark[300],
        contrastText: geoViewColors.success.contrastText(),
      },
      contrastThreshold: 3,
      tonalOffset: 0.2,
      text: {
        primary: geoViewColors.textColor.light[50],
        secondary: geoViewColors.textColor.light[500],
        disabled: 'rgba(0, 0, 0, 0.38)',
      },
      divider: 'rgba(0, 0, 0, 0.12)',
      background: {
        paper: geoViewColors.bgColor.light[600],
        default: '#fff',
        // grey: '#eeeeee',
      },
      action: {
        active: 'rgba(81,91,165, 0.94)',
        hover: `rgba(81,91,165, ${opacity.hoverOpacity})`,
        hoverOpacity: opacity.hoverOpacity,
        selected: `rgba(81,91,165, ${opacity.selectedOpacity})`,
        selectedOpacity: opacity.selectedOpacity,
        // hoverRow: `rgba(0, 255, 255, ${opacity.hoverOpacity})`,
        // selectedRow: `rgba(0, 255, 255, ${opacity.selectedOpacity})`,
        disabled: 'rgba(0, 0, 0, 0.26)',
        disabledBackground: `rgba(0, 0, 0, ${opacity.focusOpacity})`,
        disabledOpacity: opacity.disabledOpacity,
        focus: `rgba(0, 0, 0, ${opacity.focusOpacity})`,
        focusOpacity: opacity.focusOpacity,
        activatedOpacity: opacity.activatedOpacity,
      },
    },

    // start of other options
    typography: {
      fontSize: defaultFontSize,
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
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: geoViewColors.bgColor.dark[100], // Background color for the Tabs component
          },
          indicator: {
            backgroundColor: '#FF4081', // Background color for the selected tab indicator
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: geoViewColors.textColor.light[100], // Text color for the tabs
            '&.Mui-selected': {
              color: `${geoViewColors.primary.light[200]} !important`, // Text color for the selected tab
            },
          },
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
  };

  return themeOptions;
};
