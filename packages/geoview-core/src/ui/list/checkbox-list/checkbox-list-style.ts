import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the checkbox list component.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
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
