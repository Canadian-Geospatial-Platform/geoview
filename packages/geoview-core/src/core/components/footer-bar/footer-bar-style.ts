import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  tabsContainer: {
    position: 'relative',
    background: theme.palette.geoViewColor.bgColor.dark[50],
    boxShadow: 2,
    width: '100%',
    transition: 'height 0.2s ease-out',
    height: '55px',

    '&.MuiGrid-container': {
      background: theme.palette.geoViewColor.bgColor.dark[50],
    },
    '& .MuiTabs-root': {
      height: '56px',
    },
    '& .MuiTabs-flexContainer': {
      alignItems: 'center',
      height: '56px',
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .Mui-selected': {
      color: `${theme.palette.geoViewColor.white} !important`,
      background: theme.palette.geoViewColor.primary.main,
      borderRadius: '0.5rem',
      margin: '0.5rem',
      minHeight: 0,
    },
  },
});
