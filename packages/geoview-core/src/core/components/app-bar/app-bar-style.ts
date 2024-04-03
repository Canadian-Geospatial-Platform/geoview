import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
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
    width: 60,
    '& li': {
      backgroundColor: 'transparent',
      justifyContent: 'center',
      margin: '16px 0',
      padding: 0,
      '&:hover': {
        backgroundColor: 'transparent',
        color: theme.palette.geoViewColor.primary.light[300],
      },
    },
    '& hr': {
      width: '80%',
      marginLeft: '7px',
    },
  },

  appBarButtons: {
    borderRightColor: theme.palette.geoViewColor.primary.light[100],
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    width: 64,
  },
  appBarButton: {
    backgroundColor: theme.palette.geoViewColor.primary.main,
    color: theme.palette.geoViewColor.primary.light[700],
    height: 44,
    width: 44,
    transition: 'background-color 0.3s ease-in-out',
    border: `2px solid transparent`,
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor.primary.light[100],
      color: theme.palette.geoViewColor.primary.light[700],
    },
    '&:focus': {
      backgroundColor: theme.palette.geoViewColor.primary.light[150],
      color: theme.palette.geoViewColor.primary.light[700],
    },
    '&:active': {
      backgroundColor: theme.palette.geoViewColor.primary.light[100],
      color: theme.palette.geoViewColor.primary.light[700],
    },
    '&.active': {
      border: `2px solid ${theme.palette.geoViewColor.primary.light[100]}`,
      backgroundColor: 'transparent',
      color: theme.palette.geoViewColor.primary.light[100],
    },
    '& .MuiSvgIcon-root': {
      height: 20,
      width: 20,
    },
  },
  versionButtonDiv: {
    position: 'absolute',
    bottom: 0,

    '&.interaction-static': {
      backgroundColor: theme.palette.geoViewColor.grey.lighten(0.8, 0.7),
      paddingRight: 5,
      borderTop: `3px solid ${theme.palette.geoViewColor.primary.darken(0, 0.5)}`,
      borderRight: `3px solid ${theme.palette.geoViewColor.primary.darken(0, 0.5)}`,
    },
  },
  appBarPanels: {},
});
