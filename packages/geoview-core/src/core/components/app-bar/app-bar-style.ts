import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  appBar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    backgroundColor: theme.appBar.background,
    border: theme.appBar.border,
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
        color: theme.palette.geoViewColors.primary.light,
      },
    },
    '& hr': {
      width: '80%',
      marginLeft: '7px',
    },
  },

  appBarButtons: {
    borderRightColor: theme.appBar.border,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    width: 64,
  },
  appBarButton: {
    backgroundColor: theme.appBar.btnDefaultBg,
    color: theme.palette.geoViewColors.primary.light,
    height: 44,
    width: 44,
    transition: 'background-color 0.3s ease-in-out',
    '&:hover': {
      backgroundColor: theme.appBar.btnHoverBg,
      color: theme.palette.geoViewColors.primary.light,
    },
    '&:focus': {
      backgroundColor: theme.appBar.btnFocusBg,
      color: theme.palette.geoViewColors.primary.light,
    },
    '&:active': {
      backgroundColor: theme.appBar.btnActiveBg,
      color: theme.palette.geoViewColors.primary.light,
    },
    '&.active': {
      backgroundColor: theme.appBar.btnActiveBg,
      color: theme.palette.background.paper,
    },
    '& .MuiSvgIcon-root': {
      height: 20,
      width: 20,
    },
  },
  versionButtonDiv: {
    position: 'absolute',
    bottom: 0,
  },
  appBarPanels: {},
});
