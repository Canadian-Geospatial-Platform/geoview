import { Theme } from '@mui/material/styles';
import { SxStyles } from '@/ui/style/types';

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
      paddingBottom: '60px',
      '&>div': {
        border: 'unset !important',
      },
    },
  },
  appBarList: {
    '& li': {
      backgroundColor: 'transparent',
      justifyContent: 'center',
    },
    '& hr': {
      width: '80%',
      marginLeft: '5px',
    },
  },
  appBarButtons: {
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
  versionButtonDiv: {
    position: 'absolute',
    bottom: 0,
  },
  appBarPanels: {},
});
