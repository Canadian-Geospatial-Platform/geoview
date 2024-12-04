import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the MUI circular progress
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '0px',
    bottom: '0px',
    left: '0px',
    right: '0px',
    zIndex: 10000,
    backgroundColor: theme.palette.geoViewColor?.bgColor.dark[900],
    textAlign: 'center',
    transition: theme.transitions.create(['visibility', 'opacity'], {
      delay: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions?.duration?.splash,
    }),
  },
  progress: {
    width: '100px !important',
    height: '100px !important',
    position: 'absolute',
  },
});
