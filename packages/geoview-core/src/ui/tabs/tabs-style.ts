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
    borderTop: '1px solid',
    borderTopColor: 'divider',
    flexGrow: 1,
    height: isMapFullScreen ? 'calc(100% - 56px)' : `calc(${appHeight}px - 56px)`,
    overflow: 'hidden',
    paddingTop: '0 !important',
    width: '100%',
    '.tab-panel': {
      height: '100%',
    },
  },
  tab: {
    fontSize: theme.palette.geoViewFontSize.default,
    fontWeight: 'bold',
    minWidth: 'min(4vw, 24px)',
    padding: '0.5rem 1rem',
    margin: '0 0.5rem',
    textTransform: 'capitalize',
    '.MuiTab-iconWrapper': {
      marginRight: '7px',
      maxWidth: '18px',
    },
    ':focus-visible': {
      border: `2px solid ${theme.palette.common.black}`,
      outline: 'none',
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
