import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  slider: {
    '& .MuiSlider-root': {
      color: '#fff',
    },
    '& .MuiSlider-thumb': {
      width: 15,
      height: 15,
      color: theme.palette.common.black,
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
    '& .MuiSlider-rail': {
      opacity: 0.35,
      color: 'rgba(0,0,0,0.87)',
    },
    '& .MuiSlider-track': {
      color: '#000',
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
