import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
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
