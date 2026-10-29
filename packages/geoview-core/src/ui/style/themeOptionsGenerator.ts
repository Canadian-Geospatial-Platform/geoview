import type { PaletteMode, ThemeOptions } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import type { CSSObject } from '@mui/system';
import type { IGeoViewColors, ThemeTypographyInput, TypographyVariant, TypographyScaleKey } from '@/ui/style/types';
import {
  font,
  headingStyles,
  opacity,
  geoViewColors as defaultGeoViewColors,
  getGeoViewFontSizes,
  GEOVIEW_SHAPE,
  TYPOGRAPHY_SCALE,
} from '@/ui/style/default';
import { logger } from '@/core/utils/logger';

/**
 * Returns the fullscreen element container for tooltip popper placement.
 *
 * Fixes tooltips not appearing in fullscreen mode.
 *
 * @returns The fullscreen element if active, otherwise document body
 * @see https://github.com/mui/material-ui/issues/15618#issuecomment-1893503162
 */
function tooltipsPopperContainer(): Element | null {
  // Use the fullscreen element if in fullscreen mode, otherwise just the document's body
  return document.fullscreenElement ?? document.body;
}

/** WCAG 2.1 SC 2.4.7 compliant focus indicator outline width. */
export const FOCUS_OUTLINE_WIDTH = '3px';

/** Focus indicator outline offset distance from element boundary. */
export const FOCUS_OUTLINE_OFFSET = '2px';

/** Focus indicator halo (box-shadow) size for enhanced visibility. */
export const FOCUS_HALO_SIZE = '6px';

/**
 * Gets shared focus indicator styles for keyboard navigation.
 *
 * Covers non-MUI controls, composite indicators and wrappers whose external theme
 * has not enabled MUI's focusVisible option. Native Material indicators are owned by the theme.
 *
 * @param geoViewColors - GeoView color palette for focus indicator colors
 * @returns Focus indicator styles for the caller's keyboard-focus selector
 */
export const getFocusIndicatorStyles = (geoViewColors: IGeoViewColors): CSSObject => ({
  outline: `${FOCUS_OUTLINE_WIDTH} solid ${geoViewColors.focusIndicator.outline}`,
  outlineOffset: FOCUS_OUTLINE_OFFSET,
  boxShadow: `0 0 0 ${FOCUS_HALO_SIZE} ${geoViewColors.focusIndicator.halo}`,
});

/**
 * WCAG-compliant focus indicator styles for InputBase-derived form controls.
 *
 * Reuses getFocusIndicatorStyles' outline but drops the box-shadow halo, since form controls
 * render their own border/underline and the halo was visually redundant.
 *
 * @param geoViewColors - GeoView color palette for focus indicator colors
 * @returns Focus indicator style object (no halo) for use with :has(:focus-visible) on the input root
 */
export const getFormControlFocusIndicatorStyles = (geoViewColors: IGeoViewColors): CSSObject => ({
  ...getFocusIndicatorStyles(geoViewColors),
  boxShadow: 'none',
});

/**
 * Generates button style overrides for all button variants.
 *
 * Note: Material focus indicators are owned by theme.focusVisible to avoid duplication.
 *
 * @param geoViewColors - GeoView color palette to derive button styles from
 * @param palette - Generated MUI palette for semantic button colours
 * @param transitions - Current theme transitions for button interactions
 * @returns Style override object for MUI Button and IconButton components
 */
const getButtonStyleOverrides = (
  geoViewColors: IGeoViewColors,
  palette: Theme['palette'],
  transitions: Theme['transitions']
): CSSObject => ({
  '&.highlighted': {
    '&:hover, &:active, &.active': {
      backgroundColor: palette.primary.main,
      color: palette.primary.contrastText,
    },
  },
  '&.buttonOutline': {
    backgroundColor: 'transparent',
    border: `3px solid transparent`,
    color: palette.primary.main,
    '&:hover, &:active, &.active': {
      backgroundColor: palette.action.hover,
      border: `3px solid ${palette.primary.light}`,
      color: palette.primary.dark,
    },
    // Active state gets a stronger border than hover: this must come after the
    // combined hover/active block to override its borderColor.
    '&:active, &.active': {
      borderColor: palette.primary.main,
    },
    '&:disabled': {
      color: palette.text.disabled,
      backgroundColor: 'transparent',
    },
    '&[aria-disabled="true"]': {
      color: palette.text.disabled,
      backgroundColor: 'transparent',
      cursor: 'not-allowed',
    },
  },
  '&.buttonPopperClose': {
    // used for Popper/dialog close buttons
    backgroundColor: 'transparent',
    border: `1px solid ${palette.primary.main}`,
    color: palette.primary.main,
    height: 36,
    width: 36,
    transition: transitions.create('background-color', {
      duration: transitions.duration.standard,
      easing: transitions.easing.easeInOut,
    }),
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
    '&:disabled': {
      color: palette.text.disabled,
      borderColor: palette.action.disabled,
      backgroundColor: 'transparent',
    },
  },
  '&.buttonFilledOutline:not(:disabled)': {
    backgroundColor: palette.primary.main,
    border: `3px solid transparent`,
    color: palette.primary.contrastText,
    '&:hover, &:active, &.active': {
      backgroundColor: palette.primary.light,
      border: `3px solid ${palette.primary.light}`,
      color: palette.primary.dark,
    },
    '&:active, &.active': {
      borderColor: palette.primary.main,
    },
  },
  '&.buttonFilledOutline:disabled': {
    backgroundColor: palette.action.disabledBackground,
  },
  '&.buttonFilled': {
    // used for app-bar buttons
    backgroundColor: `transparent`,
    border: `2px solid transparent`,
    color: palette.primary.main,
    '&:focus': {
      backgroundColor: palette.primary.main,
      color: palette.primary.contrastText,
    },
    '&:hover': {
      backgroundColor: palette.action.hover,
      color: palette.text.primary,
    },
    '&:active, &.active': {
      backgroundColor: palette.primary.main,
      color: palette.primary.contrastText,
    },
    '&.active:hover': {
      backgroundColor: palette.primary.dark,
    },
    '&:disabled': {
      color: palette.text.disabled,
    },
  },
  '&.appBarButtonStatic': {
    // used for app-bar buttons
    borderRadius: GEOVIEW_SHAPE.borderRadiusFull,
    height: 40,
    width: 40,
    '&:hover': {
      backgroundColor: palette.action.hover,
      border: `2px solid ${palette.primary.light}`,
      color: palette.text.primary,
    },
    '&:active, &.active': {
      backgroundColor: palette.primary.main,
      border: `2px solid ${palette.primary.main}`,
      color: palette.primary.contrastText,
    },
    '&.active:hover': {
      backgroundColor: palette.primary.dark,
    },
    '&:disabled': {
      color: palette.text.disabled,
    },
    '&:focus-visible': {
      ...getFocusIndicatorStyles(geoViewColors),
      outlineOffset: 0,
      boxShadow: 'none',
    },
  },
});

/**
 * Generates complete MUI ThemeOptions from a GeoView color palette.
 *
 * Configures all MUI component overrides, typography, palette, and spacing
 * to match GeoView's design system.
 *
 * @param options - Colors, font, mode and calibrated typography for the selected display theme
 * @returns Complete MUI ThemeOptions configuration
 */
export const generateThemeOptions = ({
  geoViewColors = defaultGeoViewColors,
  themeFont = font,
  mode = 'light',
  typography,
}: {
  geoViewColors?: IGeoViewColors;
  themeFont?: string;
  mode?: PaletteMode;
  typography: ThemeTypographyInput;
}): ThemeOptions => {
  logger.logTraceCore('ui/style/themeOptionsGenerator - generateThemeOptions', geoViewColors);

  const variantScale: Record<TypographyVariant, TypographyScaleKey> = {
    h1: 'display',
    h2: 'xxl',
    h3: 'xl',
    h4: 'lg',
    h5: 'md',
    h6: 'default',
    subtitle1: 'default',
    subtitle2: 'xs',
    body1: 'default',
    body2: 'sm',
    caption: 'xs',
    overline: 'sm',
    button: 'default',
    label: 'sm',
    ...typography.scaleOverrides,
  };
  /**
   * Resolves the selected scale key through the calibrated base theme.
   *
   * @param variant - Typography variant whose size is being generated
   * @returns Calibrated rem size
   */
  const variantSize = (variant: TypographyVariant): string => typography.pxToRem(TYPOGRAPHY_SCALE[variantScale[variant]]);

  const themeHeadingStyles = {
    ...headingStyles,
    fontFamily: themeFont,
  };

  const themeOptions: ThemeOptions = {
    focusVisible: {
      outlineWidth: FOCUS_OUTLINE_WIDTH,
      outlineStyle: 'solid',
      outlineColor: geoViewColors.focusIndicator.outline,
      outlineOffset: FOCUS_OUTLINE_OFFSET,
      boxShadow: `0 0 0 ${FOCUS_HALO_SIZE} ${geoViewColors.focusIndicator.halo}`,
    },
    palette: {
      mode,
      geoViewColor: geoViewColors,
      geoViewFontSize: getGeoViewFontSizes(typography.pxToRem),
      geoViewSpacingAndSizing: {},
      inverseContent: {
        surface: geoViewColors.bgColor.dark[800],
        text: geoViewColors.bgColor.light[800],
      },
      layerVisibility: {
        unchecked: geoViewColors.bgColor.dark[200],
        checked: geoViewColors.bgColor.dark[600],
      },
      // Surface levels describe depth, not lightness; their luminance direction inverts in dark mode.
      surface: {
        low: geoViewColors.bgColor.dark[50],
        high: geoViewColors.bgColor.main,
      },
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
      // This default theme has no distinct secondary colour. `secondary` uses the same color as
      // primary. See geoViewColors default.ts.
      secondary: {
        main: geoViewColors.secondary.main,
        light: geoViewColors.secondary.light[600],
        dark: geoViewColors.secondary.dark[200],
        contrastText: geoViewColors.secondary.contrastText(),
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
        primary: geoViewColors.textColor.main,
        secondary: geoViewColors.textColor.light[200], // WCAG - ensures sufficient contrast for accessibility
      },
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
        disabledOpacity: opacity.disabledOpacity,
        focus: geoViewColors.primary.opacity(opacity.focusOpacity),
        focusOpacity: opacity.focusOpacity,
        activatedOpacity: opacity.activatedOpacity,
      },
    },

    // start of other options
    typography: {
      fontSize: 14,
      fontFamily: themeFont,
      h1: { ...themeHeadingStyles, fontSize: variantSize('h1') },
      h2: { ...themeHeadingStyles, fontSize: variantSize('h2') },
      h3: { ...themeHeadingStyles, fontSize: variantSize('h3') },
      h4: { ...themeHeadingStyles, fontSize: variantSize('h4') },
      h5: { ...themeHeadingStyles, fontSize: variantSize('h5') },
      h6: {
        fontWeight: 400,
        fontSize: variantSize('h6'),
      },
      subtitle1: {
        fontSize: variantSize('subtitle1'),
        lineHeight: 1.25,
      },
      subtitle2: {
        fontSize: variantSize('subtitle2'),
        lineHeight: 1.25,
      },
      body1: { fontSize: variantSize('body1') },
      body2: { fontSize: variantSize('body2') },
      caption: { fontSize: variantSize('caption') },
      label: { fontSize: variantSize('label') },
      overline: {
        fontSize: variantSize('overline'),
        fontWeight: 500,
        letterSpacing: 2,
      },
      button: {
        fontSize: variantSize('button'),
        fontWeight: 500,
      },
      control: {
        fontSize: 11,
        fontWeight: 500,
      },
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
      // Numeric base read by MUI components (must stay a number), derived from the Md token (a px string)
      borderRadius: parseInt(GEOVIEW_SHAPE.borderRadiusMd, 10),
      ...GEOVIEW_SHAPE,
    },
    components: {
      MuiTooltip: {
        defaultProps: {
          slotProps: {
            popper: {
              container: tooltipsPopperContainer,
            },
          },
        },
        styleOverrides: {
          tooltip: ({ theme }) => ({
            backgroundColor: theme.palette.inverseContent?.surface ?? theme.palette.grey[900],
            color: theme.palette.inverseContent?.text ?? theme.palette.common.white,
          }),
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
          root: ({ theme }) => ({
            borderWidth: '1px',
            borderColor: theme.palette.divider,
            borderStyle: 'solid',
            boxShadow: `0px 12px 9px -13px ${geoViewColors.bgColor.darken(0.2, 0.5)}`,

            '&.unbordered': {
              borderStyle: 'none',
            },
          }),
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            // Keep the 3px outline fully inside dense/clipped rows without repeating the native ring.
            '&.Mui-focusVisible': {
              outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
              boxShadow: 'none',
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&.layer-panel': {
              boxShadow: 'none',
              '&[data-layer-depth="0"], &:not([data-layer-depth])': {
                background: `${theme.palette.background.paper} 0% 0% no-repeat padding-box`,
                borderRadius: GEOVIEW_SHAPE.borderRadiusMd,
                marginBottom: '10px',
              },

              '&[data-layer-depth] &:not([data-layer-depth="0"])': {
                borderRadius: GEOVIEW_SHAPE.borderRadiusNone,
                border: 'unset',
                backgroundColor: 'unset',
              },

              '& .MuiListItemButton-root:not(.Mui-focusVisible)': {
                backgroundColor: 'transparent !important',
              },

              // for selected layer
              '&.selectedLayer, &.selected': {
                borderColor: `${theme.palette.primary.main} !important`,
                borderWidth: '2px !important',
                borderStyle: 'solid !important',
              },
              // for handling layer status
              '&.error, &.query-error': {
                background: geoViewColors.error.lighten(0.7, 0.6),
                '& .MuiListItemText-secondary': {
                  fontWeight: 'bold',
                  color: theme.palette.error.main,
                },
              },
              // for handling loading layer status
              '&.loading, &.processing, &.query-processing': {
                background: geoViewColors.info.lighten(0.7, 0.6),
                '& .MuiListItemText-secondary': {
                  fontWeight: 'bold',
                  color: theme.palette.info.main,
                },
              },
              // for handling registered layer status - means we are unable to query metadata, server is slow
              '&.registered': {
                background: geoViewColors.grey.lighten(0.7, 0.6),
                '& .MuiListItemText-secondary': {
                  fontWeight: 'bold',
                  color: geoViewColors.info.main,
                },
              },
            },
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => getButtonStyleOverrides(geoViewColors, theme.palette, theme.transitions),
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => getButtonStyleOverrides(geoViewColors, theme.palette, theme.transitions),
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
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.default, // Background color for the Tabs component
          }),
          indicator: {
            backgroundColor: '#FF4081', // Background color for the selected tab indicator
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary, // Text color for the tabs
            '&.Mui-selected': {
              color: theme.palette.primary.main, // Text color for the selected tab
            },
          }),
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.primary,
            overflowWrap: 'anywhere',
            wordBreak: 'normal',
            hyphens: 'auto',
          }),
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiInputBase-input::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 1,
            },
            // Hide browser's native search input controls globally: It's confusing to keyboard users as it isn't focusable
            '& input[type="search"]::-webkit-search-cancel-button': {
              WebkitAppearance: 'none',
              appearance: 'none',
            },
            '& input[type="search"]::-webkit-search-decoration': {
              WebkitAppearance: 'none',
              appearance: 'none',
            },
            // Keyboard-only focus indicator for InputBase-derived controls (TextField, Select, Autocomplete, date-pickers).
            // Scoped to .geoview-keyboard-active (GeoView keyboard-navigation mode) because :focus-visible alone still
            // matches text inputs on mouse click; .geoview-keyboard-active ensures mouse users never see the outline.
            // MUI's theme.focusVisible has no equivalent for this GeoView keyboard-mode gate.
            '.geoview-keyboard-active &:has(:focus-visible)': {
              ...getFormControlFocusIndicatorStyles(geoViewColors),
              outlineOffset: '0',
            },
            // Standard-variant focus underline is the root's own ::after, not the input's — suppress it on keyboard focus
            '.geoview-keyboard-active &:has(:focus-visible)::after': {
              border: 'none',
            },
            '.geoview-keyboard-active &:has(:focus-visible)::before': {
              border: 'none',
            },
          }),
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.secondary,
            opacity: 1,
            // Keep the focused label the same as the root color, but preserve MUI's error color
            '&.Mui-focused:not(.Mui-error)': {
              color: theme.palette.text.secondary,
            },
          }),
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
