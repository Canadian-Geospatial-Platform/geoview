import type { Theme } from '@mui/material';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

/**
 * Gets custom sx classes for the slider component.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  slider: {
    '& .MuiSlider-root': {
      color: theme.palette.geoViewColor?.white,
    },
    '& .MuiSlider-thumb': {
      width: 15,
      height: 15,
      color: theme.palette.geoViewColor?.primary.main,
      transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
      '&:before': {
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
      },
      '&:hover': {
        boxShadow: `0px 0px 0px 8px ${'rgb(255 255 255 / 16%)'}`,
      },
      '&.Mui-focusVisible': {
        boxShadow: `
    0 0 0 2px ${theme.palette.geoViewColor.white},
    0 0 0 4px ${theme.palette.common.black}
  `,
      },
      '&.Mui-active': {
        width: 30,
        height: 30,
      },
    },
    '& .MuiSlider-thumb:hover': {
      boxShadow: 'rgba(1, 0, 155, 0.7) 0px 0px 0px 3px !important',
    },
    '& .MuiSlider-valueLabel': {
      fontSize: '0.7rem',
      padding: '0.25rem 0.4rem',
      [theme.breakpoints.down('md')]: {
        ...visuallyHidden, // Hide value tooltips on tablets and below
      },
    },
    '&.MuiSlider-labelSpread .MuiSlider-thumb:nth-last-of-type(2) .MuiSlider-valueLabel.MuiSlider-valueLabelOpen': {
      transform: 'translateX(-42%) translateY(-100%) scale(1)',
      '&:before': {
        left: 'calc(100% - 6px)',
      },
    },
    '&.MuiSlider-labelSpread .MuiSlider-thumb:last-of-type .MuiSlider-valueLabel.MuiSlider-valueLabelOpen': {
      transform: 'translateX(42%) translateY(-100%) scale(1)',
      '&:before': {
        left: '6px',
      },
    },
    '& .MuiSlider-rail': {
      opacity: 0.35,
      color: theme.palette.geoViewColor?.grey.darken(0.9, 0.87),
    },
    '& .MuiSlider-track': {
      color: theme.palette.geoViewColor?.primary.main,
    },
    '& .MuiSlider-mark': {
      height: 4,
      width: 4,
      color: '#000',
    },
    '& .MuiSlider-markLabel': {
      color: theme.palette.geoViewColor.textColor.light[200],
      '&.MuiSlider-markLabelActive': {
        color: theme.palette.geoViewColor.textColor.main,
      },
    },
    '& .MuiSlider-markLabel-overlap': {
      display: 'none !important',
    },
    '& .MuiSlider-mark-hidden': {
      opacity: 0,
      pointerEvents: 'none',
    },
  },
});
