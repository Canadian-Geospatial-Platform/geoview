import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  tabsContainer: {
    position: 'relative',
    backgroundColor: theme.palette.background.default,
    width: '100%',
    transition: 'height 0.2s ease-out',
    height: '55px',
  },
  expandBtn: {
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
});
