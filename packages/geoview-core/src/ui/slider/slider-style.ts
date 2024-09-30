import { Theme } from '@mui/material';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
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
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${'rgb(255 255 255 / 16%)'}`,
      },
      '&.Mui-active': {
        width: 30,
        height: 30,
      },
    },
    '&  .MuiSlider-thumb:hover, .MuiSlider-thumb.Mui-focusVisible': {
      boxShadow: 'rgba(1, 0, 155, 0.7) 0px 0px 0px 3px !important',
    },
    '& .MuiSlider-valueLabel': {
      fontSize: '0.7rem',
      padding: '0.25rem 0.4rem',
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
    '& .MuiSlider-markLabel-overlap': {
      display: 'none',
    },
  },
});
