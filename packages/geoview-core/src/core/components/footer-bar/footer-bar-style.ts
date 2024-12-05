import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the footer bar
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
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
    '& .MuiTab-root': {
      minHeight: '56px',
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .MuiTab-root.Mui-selected': {
      color: `${theme.palette.geoViewColor.white} !important`,
      background: theme.palette.geoViewColor.primary.main,
      borderRadius: '0.5rem',
      margin: '0.5rem',
      minHeight: 0,
    },
  },
});
