import type { Theme } from '@mui/material';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the tabs component.
 *
 * @param theme - The MUI theme object
 * @param isMapFullScreen - Whether the map is in fullscreen mode
 * @param appHeight - The application height value
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme, isMapFullScreen: boolean, appHeight: string): SxStyles => ({
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
    height: isMapFullScreen ? 'calc(100% - 56px)' : `calc(${appHeight} - 56px)`,
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
  },
  mobileDropdown: {
    marginLeft: '41px',
    maxWidth: '200px',
    padding: '8px 0',
    '& .MuiInputBase-root': {
      borderRadius: '4px',
    },
    '& .MuiSelect-select': {
      padding: '8px 12px !important',
    },
  },
});
