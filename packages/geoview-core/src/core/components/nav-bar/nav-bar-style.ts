import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
  navBarRef: {
    position: 'absolute',
    right: theme.spacing(5),
    height: '600px',
    maxHeight: 'calc( 100% - 200px)',
    display: 'flex',
    flexDirection: 'row',
    marginRight: 0,
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transition: 'bottom 300ms ease-in-out',
  },
  navBtnGroupContainer: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    pointerEvents: 'auto',
    justifyContent: 'end',
    overflowY: 'hidden',
    padding: 5,
  },
  navBtnGroup: {
    borderRadius: theme.spacing(5),
    backgroundColor: theme.navBar.btnDefaultBg,
    '&:not(:last-child)': {
      marginBottom: theme.spacing(11),
    },
    '& .MuiButtonGroup-grouped:not(:last-child)': {
      borderColor: theme.navBar.borderColor,
    },
  },
  navButton: {
    backgroundColor: theme.navBar.btnDefaultBg,
    color: theme.navBar.btnDefaultColor,
    borderRadius: theme.spacing(5),
    width: theme.navBar.btnWidth,
    height: theme.navBar.btnHeight,
    maxWidth: theme.navBar.btnWidth,
    minWidth: theme.navBar.btnWidth,
    padding: 'initial',
    transition: 'background-color 0.3s ease-in-out',
    '&:not(:last-of-type)': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      borderBottom: `1px solid ${theme.navBar.borderColor}`,
    },
    '&:not(:first-of-type)': {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    '&:hover': {
      backgroundColor: theme.navBar.btnHoverBg,
      color: theme.navBar.btnHoverColor,
    },
    '&:focus': {
      backgroundColor: theme.navBar.btnFocusBg,
      color: theme.navBar.btnFocusColor,
    },
    '&:active': {
      backgroundColor: theme.navBar.btnFocusBg,
      color: theme.navBar.btnActiveColor,
    },
  },
});
