import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
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
