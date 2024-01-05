import { Theme } from '@mui/material/styles';

const drawerWidth = 200;
export const getSxClasses = (theme: Theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '& $toolbar': {
      justifyContent: 'flex-end',
    },
  },
  drawerClose: {
    transition: theme.transitions?.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: '61px',
    '& $toolbar': {
      justifyContent: 'center',
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(0, 1),
  },
});
