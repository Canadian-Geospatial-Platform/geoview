import { SxProps } from '@mui/system';

type SxStyles = Record<string, SxProps>;

/**
 * Get custom sx classes for the resize footer panel size
 *
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (): SxStyles => ({
  slider: {
    height: 300,
    padding: '1.5rem 0.5rem 1.5rem 1rem',
    '& .MuiSlider-markLabel': {
      left: '33px',
      '&:nth-of-type(1)': {
        bottom: '3%',
      },
      '&:last-of-type': {
        bottom: '98%',
        left: '30px',
      },
    },
  },
});
