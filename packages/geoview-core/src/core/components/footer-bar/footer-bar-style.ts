import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the footer bar.
 *
 * @param theme - The theme object
 * @returns The sx classes object
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
    '& .MuiTab-root': {
      minHeight: '50px',
    },
    '& .MuiTabs-root': {
      minHeight: '50px',
      background: theme.palette.geoViewColor.bgColor.main,
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .MuiTabs-root .MuiTab-iconWrapper': {
      maxWidth: '24px',
      color: theme.palette.geoViewColor.primary.main,
    },
    '& .MuiTab-root.Mui-selected': {
      color: theme.palette.geoViewColor.white,
      background: theme.palette.geoViewColor.primary.main,
      minHeight: 0,
    },
    '& .MuiTab-root:hover .MuiTab-iconWrapper': {
      color: theme.palette.geoViewColor.white,
    },
    '& .MuiTab-root.Mui-selected .MuiTab-iconWrapper': {
      color: theme.palette.geoViewColor.white,
    },
  },
});
