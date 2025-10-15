import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the footer bar
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  tabContent: {
    height: '100%',
  },
  tabsContainer: {
    position: 'relative',
    background: theme.palette.geoViewColor.bgColor.main,
    boxShadow: 2,
    width: '100%',
    transition: 'height 0.2s ease-out',
    '& .MuiGrid-container': {
      background: theme.palette.geoViewColor.bgColor.main,
    },
    '& .MuiTab-root': {
      minHeight: '40px',
    },
    '& .MuiTabs-root': {
      minHeight: '40px',
      background: theme.palette.geoViewColor.bgColor.main,
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .MuiTab-root.Mui-selected': {
      color: `${theme.palette.geoViewColor.white} !important`,
      background: theme.palette.geoViewColor.primary.main,
      minHeight: 0,
    },
  },
});
