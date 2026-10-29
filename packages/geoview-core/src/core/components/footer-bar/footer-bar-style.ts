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
    background: theme.palette.surface?.high ?? theme.palette.background.paper,
    boxShadow: 2,
    width: '100%',
    transition: theme.transitions.create('height', {
      duration: theme.transitions.duration.shorter,
      easing: theme.transitions.easing.easeOut,
    }),
    '& .MuiTab-root': {
      minHeight: '48px',
    },
    '& .MuiTabs-root': {
      minHeight: '48px',
      background: theme.palette.surface?.high ?? theme.palette.background.paper,
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .MuiTabs-root .MuiTab-icon': {
      maxWidth: '24px',
      color: theme.palette.primary.main,
    },
    '& .MuiTab-root.Mui-selected': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.main,
      minHeight: 0,
    },
    '& .MuiTab-root:hover .MuiTab-icon': {
      color: theme.palette.text.primary,
    },
    '& .MuiTab-root.Mui-selected .MuiTab-icon': {
      color: theme.palette.primary.contrastText,
    },
  },
});
