import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  tabsContainer: {
    position: 'relative',
    background: theme.palette.geoViewColor.bgColor.main,
    boxShadow: 2,
    width: '100%',
    transition: 'height 0.2s ease-out',
    height: '55px',

    '&.MuiGrid-container': {
      background: theme.palette.geoViewColor.bgColor.main,
    },
  },
});
