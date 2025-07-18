import { Theme } from '@mui/material';
import { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the MUI tabs
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme, isMapFullScreen: boolean, appHeight: number): SxStyles => ({
  rightIcons: {
    marginTop: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  panel: {
    borderTop: 1,
    borderTopColor: 'divider',
    flexGrow: 1,
    height: isMapFullScreen ? 'calc(100% - 56px)' : `calc(${appHeight}px - 56px)`,
    overflow: 'hidden',
    paddingTop: '0 !important',
    width: '100%',
    '.tab-panel': {
      height: '100%',
      backgroundColor: theme.palette.geoViewColor.bgColor.dark[50],
    },
  },
  tab: {
    fontSize: theme.palette.geoViewFontSize.default,
    fontWeight: 'bold',
    minWidth: 'min(4vw, 24px)',
    padding: '0.5rem 1.5rem',
    margin: 0,
    textTransform: 'capitalize',
    '.MuiTab-iconWrapper': {
      marginRight: '7px',
      maxWidth: '18px',
    },
    ':focus-visible': {
      border: `2px solid ${theme.palette.common.black}`,
      outline: 'none',
    },
    transition: 'background-color 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor.primary.light[200],
      color: theme.palette.geoViewColor.white,
    },
    '&:focus': {
      backgroundColor: theme.palette.geoViewColor.primary.light[200],
      color: theme.palette.geoViewColor.white,
    },
  },
  mobileDropdown: {
    maxWidth: '200px',
    p: 6,
    '& .MuiInputBase-root': {
      borderRadius: '4px',
    },
    '& .MuiSelect-select': {
      padding: '8px 12px !important',
    },
  },
});
