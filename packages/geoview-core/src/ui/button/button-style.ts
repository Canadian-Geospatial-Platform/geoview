import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

type SxStyles = Record<string, SxProps<Theme>>;

/**
 * Get custom sx classes for the MUI button
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  textIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.geoViewColor?.primary.dark,
  },
  text: {
    width: '100%',
    textAlign: 'center',
    textTransform: 'none',
    marginLeft: 20,
    display: 'flex',
    justifyContent: 'center',
    '& $buttonClass': {
      justifyContent: 'flex-start',
    },
  },
});
