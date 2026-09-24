import type { Theme } from '@mui/material/styles';
import type { SxProps, SxStyles } from '@/ui/style/types';
import { getFocusIndicatorStyles } from '@/ui/style/themeOptionsGenerator';
import { geoViewColors as defaultGeoViewColors } from '@/ui/style/default';

/** Minimum width style for the scale container box. */
export const SCALE_BOX_STYLES = { minWidth: 120 } as const;

/** Hides the radio circle visually but keeps it keyboard-accessible. */
export const getScaleRadioHiddenStyles = (theme: Theme): SxProps<Theme> => ({
  opacity: 0,
  width: 0,
  height: 0,
  padding: theme.spacing(0),
  margin: theme.spacing(0),
  position: 'absolute',
  top: 0,
  left: 0,
  // Prevent any pointer interaction directly on the Radio
  pointerEvents: 'none',
});

/** Styles for the FormControlLabel wrapping each scale radio option. */
export const getScaleFormControlLabelStyles = (theme: Theme): SxProps<Theme> => ({
  margin: theme.spacing(0),
  alignItems: 'center',
  width: '100%',
  cursor: 'pointer',
  justifyContent: 'center',
});

/**
 * Gets custom sx classes for the scale.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  scaleControl: {
    display: 'none',
  },
  scaleContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    height: '100%',
    ':hover': {
      backgroundColor: 'transparent',
      color: theme.palette.geoViewColor?.white,
    },
  },
  scaleContainerButton: {
    height: '100%',
    maxHeight: '40px',
    paddingBlock: theme.spacing(0.25),
    '&.Mui-focusVisible': {
      outlineOffset: '0',
      boxShadow: 'none',
    },
  },
  scaleExpandedContainer: {
    gap: theme.spacing(0.75),
    padding: theme.spacing(0, 1),
    // Show focus ring when any child Radio has focus
    '&:has(:focus-visible)': {
      borderRadius: '4px',
      ...getFocusIndicatorStyles(theme.palette.geoViewColor ?? defaultGeoViewColors),
      boxShadow: 'none',
      outlineOffset: 0,
    },
  },
  scaleExpandedCheckmarkText: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '18px',
    maxHeight: '18px',
  },
  scaleText: {
    fontSize: theme.palette.geoViewFontSize?.default,
    color: theme.palette.geoViewColor?.bgColor.dark[650],
    whiteSpace: 'nowrap',
    borderBottom: `2px solid ${theme.palette.geoViewColor?.bgColor.dark[650]}`,
    textTransform: 'lowercase',
    position: 'relative',
    display: 'inline-block',
    textAlign: 'center',

    '&.interaction-static': {
      fontSize: theme.palette.geoViewFontSize?.md,
      fontWeight: 'bold',
      borderBottom: '2px solid',
      color: theme.palette.geoViewColor?.grey.dark[500],

      '&.hasScaleLine::before, &.hasScaleLine::after': {
        backgroundColor: `${theme.palette.geoViewColor?.grey.dark[500]} !important`,
        width: '2px !important',
      },
    },

    '&.hasScaleLine::before, &.hasScaleLine::after': {
      content: '""',
      position: 'absolute',
      bottom: '-1px',
      width: '1px',
      height: '8px',
      backgroundColor: theme.palette.geoViewColor?.bgColor.dark[650],
    },

    '&.hasScaleLine::before': {
      left: '0px',
    },

    '&.hasScaleLine::after': {
      right: '0px',
    },
  },
  scaleCheckmark: {
    paddingRight: theme.spacing(0.75),
    color: theme.palette.geoViewColor?.bgColor.light[800],
  },
});
