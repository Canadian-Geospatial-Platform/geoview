import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the footer bar
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme, isFullScreen: boolean, footerPanelResizeValue: number): SxStyles => ({
  tabContent: {
    // maxHeight: isFullScreen ? `calc(${footerPanelResizeValue}vh - 40px)` : '660px', // maxHeight only when not fullscreen
    // height: isFullScreen ? `calc(${footerPanelResizeValue}vh - 40px)` : undefined, // height only when fullscreen (- padding)
    height: '100%',
  },
  tabsContainer: {
    position: 'relative',
    background: theme.palette.geoViewColor.bgColor.dark[50],
    boxShadow: 2,
    width: '100%',
    transition: 'height 0.2s ease-out',
    height: '56px',

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
