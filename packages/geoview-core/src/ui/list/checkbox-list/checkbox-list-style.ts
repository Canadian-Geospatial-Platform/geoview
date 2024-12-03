import { Theme } from '@mui/material/styles';
import { SxProps } from '@mui/system';

type SxStyles = Record<string, SxProps<Theme>>;

/**
 * Get custom sx classes for the MUI check box list
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  list: {
    padding: 0,
  },
  typography: {
    padding: 0,
  },
  listItem: {
    height: '28px',
    padding: 0,
    color: theme.palette.secondary.contrastText,
    '&:hover': {
      backgroundColor: '#dddddd',
      color: theme.palette.geoViewColor?.primary.dark,
    },
  },
  listItemIcon: {
    minWidth: '0px',
  },
  boxcontent: {
    padding: 0,
  },
});
