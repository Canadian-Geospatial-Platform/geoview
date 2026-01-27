import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the app-bar
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  appBar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    backgroundColor: theme.palette.geoViewColor.bgColor.main,
    border: theme.palette.geoViewColor.primary.light[100],

    '&.interaction-static': {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      backgroundColor: 'unset',
      border: 'unset',
      paddingBottom: '0px',
      '&>nav': {
        border: 'unset !important',
        '&>div>ul>li': {
          backgroundColor: theme.palette.geoViewColor.grey.lighten(0.8, 0.8),
          padding: '0px',
          borderRadius: '50%',
        },
        '&>div>ul>li::before': {
          display: 'none',
        },
      },
    },
  },
  appBarList: {
    '& li': {
      backgroundColor: 'transparent',
      justifyContent: 'center',
    },
  },
  appBarButtons: {
    position: 'relative',
    paddingTop: '16px',
    borderRightColor: theme.palette.geoViewColor.primary.light[100],
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    width: 50,
    '& button': {
      height: '54px',
      width: '50px',
      minWidth: '40px',
      alignContent: 'center',
      padding: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      color: theme.palette.geoViewColor.primary.main,
      transition: 'background-color 0.3s ease-in-out',
      '& span': {
        margin: 0,
      },
      '& .MuiSvgIcon-root': {
        height: 25,
        width: 25,
      },
      '& .MuiTouchRipple-root': {
        maxWidth: '50px',
      },
    },
  },
  appBarSeparator: {
    '&::before': {
      content: '""',
      display: 'block',
      borderTop: `1px solid ${theme.palette.geoViewColor.grey.light[100]}`,
      width: '40px',
      margin: 'auto 5px',
      position: 'absolute',
      top: 0,
      left: 0,
    },
    marginTop: '0.5em',
    padding: '0.5em 0 0 0',
    position: 'relative',
  },
  versionButtonDiv: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  appBarPanels: {},
});
