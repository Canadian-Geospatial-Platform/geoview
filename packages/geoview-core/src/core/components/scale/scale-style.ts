import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the scale
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  scaleControl: {
    display: 'none',
  },
  scaleContainer: {
    display: 'flex',
    backgroundColor: 'transparent',
    border: 'none',
    height: '100%',
    ':hover': {
      backgroundColor: 'transparent',
      color: theme.palette.geoViewColor.white,
    },
    '&.interaction-static': {
      padding: '5px',
      backdropFilter: 'blur(5px)',
    },
  },
  scaleExpandedContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    gap: theme.spacing(5),
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
    fontSize: theme.palette.geoViewFontSize.default,
    color: theme.palette.geoViewColor.bgColor.light[800],
    whiteSpace: 'nowrap',
    borderBottom: `2px solid ${theme.palette.geoViewColor.primary.light[300]}`,
    textTransform: 'lowercase',
    position: 'relative',
    display: 'inline-block',

    '&.interaction-static': {
      fontSize: theme.palette.geoViewFontSize.md,
      fontWeight: 'bold',
      borderBottom: '2px solid',
      color: theme.palette.geoViewColor.grey.dark[500],

      '&.hasScaleLine::before, &.hasScaleLine::after': {
        backgroundColor: `${theme.palette.geoViewColor.grey.dark[500]} !important`,
        width: '2px !important',
      },
    },

    '&.hasScaleLine::before, &.hasScaleLine::after': {
      content: '""',
      position: 'absolute',
      bottom: '-1px',
      width: '1px',
      height: '8px',
      backgroundColor: theme.palette.geoViewColor.bgColor.light[800],
    },

    '&.hasScaleLine::before': {
      left: '0px',
    },

    '&.hasScaleLine::after': {
      right: '0px',
    },
  },
  scaleCheckmark: {
    paddingRight: 5,
    color: theme.palette.geoViewColor.bgColor.light[800],
  },
});
