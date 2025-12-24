import type { ThemeOptions } from '@mui/material';
import type { IGeoViewColors } from '@/ui/style/types';
import { font, headingStyles, opacity, geoViewColors as defaultGeoViewColors, geoViewFontSizes } from '@/ui/style/default';
import { logger } from '@/core/utils/logger';

// this function is fixing tooltips not appearing in fullscreen mode, #1685
// https://github.com/mui/material-ui/issues/15618#issuecomment-1893503162
function tooltipsPopperContainer(): Element | null {
  // Use the fullscreen element if in fullscreen mode, otherwise just the document's body
  return document.fullscreenElement ?? document.body;
}

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getButtonStyleOverrides = (geoViewColors: IGeoViewColors): any => ({
  '&.highlighted': {
    '&:hover, &:active, &.active': {
      backgroundColor: `${geoViewColors.primary.main}`,
      color: `${geoViewColors.white}`,
    },
  },
  '&.buttonOutline': {
    backgroundColor: 'transparent',
    border: `3px solid transparent`,
    color: `${geoViewColors.primary.main}`,
    '&:hover, &:active, &.active': {
      backgroundColor: `${geoViewColors.bgColor.dark[100]}`,
      border: `3px solid ${geoViewColors.primary.light[500]}`,
      color: `${geoViewColors.primary.dark[100]}`,
      boxShadow: 1,
    },
    '&:disabled': {
      color: `${geoViewColors.bgColor.dark[450]}`,
      backgroundColor: 'transparent',
    },
  },
  '&.buttonFilledOutline:not(:disabled)': {
    backgroundColor: `${geoViewColors.primary.main}`,
    border: `3px solid transparent`,
    color: `${geoViewColors.white}`,
    '&:hover, &:active, &.active': {
      backgroundColor: `${geoViewColors.primary.light[800]}`,
      border: `3px solid ${geoViewColors.primary.light[500]}`,
      color: `${geoViewColors.primary.dark[100]}`,
      boxShadow: 1,
    },
  },
  '&.buttonFilledOutline:disabled': {
    backgroundColor: `${geoViewColors.bgColor.dark[150]}`,
  },
  '&.buttonFilled': {
    // used for app-bar buttons
    backgroundColor: `transparent`,
    border: `2px solid transparent`,
    color: `${geoViewColors.primary.main}`,
    '&:hover, &:focus': {
      backgroundColor: geoViewColors.primary.light[200],
      color: geoViewColors.white,
      boxShadow: 1,
    },
    '&:active, &.active': {
      backgroundColor: `${geoViewColors.primary.main}`,
      color: `${geoViewColors.white}`,
      boxShadow: 1,
    },
    '&:disabled': {
      color: `${geoViewColors.bgColor.dark[450]}`,
    },
  },
  '&.style4': {
    // used for app-bar buttons
    boxShadow: 1,
    borderRadius: 25,
    height: 40,
    width: 40,
    '&:hover, &:active, &.active': {
      backgroundColor: `${geoViewColors.primary.main}`,
      border: `2px solid ${geoViewColors.primary.light[500]}`,
      color: `${geoViewColors.white}`,
      boxShadow: 1,
    },
    '&:disabled': {
      color: `${geoViewColors.bgColor.dark[450]}`,
    },
  },
});

export const generateThemeOptions = (geoViewColors: IGeoViewColors = defaultGeoViewColors): ThemeOptions => {
  logger.logTraceCore('ui/style/themeOptionsGenerator - generateThemeOptions', geoViewColors);

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
        default: geoViewColors.bgColor.light[500],
      },
      action: {
        active: geoViewColors.primary.main,
        hover: geoViewColors.primary.opacity(opacity.hoverOpacity),
        hoverOpacity: opacity.hoverOpacity,
        selected: geoViewColors.primary.opacity(opacity.selectedOpacity),
        selectedOpacity: opacity.selectedOpacity,
        // hoverRow: `rgba(0, 255, 255, ${opacity.hoverOpacity})`,
        // selectedRow: `rgba(0, 255, 255, ${opacity.selectedOpacity})`,
        disabled: 'rgba(0, 0, 0, 0.26)',
        disabledBackground: `rgba(0, 0, 0, ${opacity.focusOpacity})`,
        disabledOpacity: opacity.disabledOpacity,
        focus: geoViewColors.primary.opacity(opacity.focusOpacity),
        focusOpacity: opacity.focusOpacity,
        activatedOpacity: opacity.activatedOpacity,
      },
    },

    // start of other options
    typography: {
      // fontSize: `${defaultFontSize}rem`,
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
        fontSize: geoViewFontSizes.default,
        lineHeight: 1.25,
      },
      subtitle2: {
        fontSize: geoViewFontSizes.xs,
        lineHeight: 1.25,
      },
      body1: {},
      body2: {},
      caption: {},
      overline: {
        fontSize: geoViewFontSizes.sm,
        fontWeight: 500,
        letterSpacing: 2,
      },
      button: {
        fontSize: geoViewFontSizes.default,
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
        tooltipDelay: 1000,
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
      MuiTooltip: {
        defaultProps: {
          PopperProps: {
            container: tooltipsPopperContainer,
          },
        },
        styleOverrides: {
          tooltip: {
            backgroundColor: geoViewColors.bgColor.dark[800],
            color: geoViewColors.bgColor.light[800],
          },
        },
      },
      MuiPopper: {
        defaultProps: {
          container: tooltipsPopperContainer,
        },
      },
      MuiMenu: {
        defaultProps: {
          container: tooltipsPopperContainer,
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 5,
            borderWidth: '1px',
            borderColor: geoViewColors.bgColor.darken(0.5, 0.5),
            borderStyle: 'solid',
            boxShadow: `0px 12px 9px -13px ${geoViewColors.bgColor.darken(0.2, 0.5)}`,

            '&.unbordered': {
              borderStyle: 'none',
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            '&.layer-panel': {
              boxShadow: 'none',
              '&[data-layer-depth="0"], &:not([data-layer-depth])': {
                background: `${geoViewColors.bgColor.light[600]} 0% 0% no-repeat padding-box`,
                borderRadius: '5px',
                marginBottom: '10px',
              },

              '&[data-layer-depth] &:not([data-layer-depth="0"])': {
                borderRadius: '0px',
                border: 'unset',
                backgroundColor: 'unset',
              },

              '& .MuiListItemButton-root:not(.Mui-focusVisible)': {
                backgroundColor: 'transparent !important',
              },

              // for selected layer
              '&.selectedLayer, &.selected': {
                borderColor: `${geoViewColors.primary.main} !important`,
                borderWidth: '2px !important',
                borderStyle: 'solid !important',
              },
              // when layer is dragging
              '&.dragging': {
                backgroundcolor: geoViewColors.primary.dark[600],
                cursor: 'grab',
                userSelect: 'none',
              },
              // for handling layer status
              '&.error, &.query-error': {
                background: geoViewColors.error.lighten(0.7, 0.6),
                '& .MuiListItemText-secondary': {
                  fontWeight: 'bold',
                  color: geoViewColors.error.main,
                },
              },
              // for handling loading layer status
              '&.loading, &.processing, &.query-processing': {
                background: geoViewColors.info.lighten(0.7, 0.6),
                '& .MuiListItemText-secondary': {
                  fontWeight: 'bold',
                  color: geoViewColors.info.main,
                },
              },
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            ...getButtonStyleOverrides(geoViewColors),
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            ...getButtonStyleOverrides(geoViewColors),
          },
        },
      },
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
              color: `${geoViewColors.primary.light[200]}`, // Text color for the selected tab
            },
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: geoViewColors.textColor.main,
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
  } as ThemeOptions;

  return themeOptions;
};
