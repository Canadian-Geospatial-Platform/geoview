import { Theme } from '@mui/material/styles';

export const getFocusTrapSxClasses = (theme: Theme) => ({
  trap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: theme.spacing(0),
    left: theme.spacing(0),
    width: '100%',
    height: '100%',
    zIndex: theme.zIndex.focusDialog,
    overflow: 'hidden',
  },
});

export const getShellSxClasses = (theme: Theme) => ({
  shell: {
    display: 'flex',
    flexDirection: 'column',
    top: theme.spacing(0),
    right: theme.spacing(0),
    left: theme.spacing(0),
    bottom: theme.spacing(0),
    overflow: 'hidden',
    zIndex: 0,
    height: '100%',
  },
  mapContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    position: 'relative',
  },
  skip: {
    position: 'absolute',
    left: -1000,
    height: 1,
    width: 1,
    textAlign: 'left',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',

    '&:active, &:focus, &:hover': {
      left: theme.spacing(0),
      zIndex: theme.zIndex.tooltip,
      width: 'auto',
      height: 'auto',
      overflow: 'visible',
    },
  },
});
