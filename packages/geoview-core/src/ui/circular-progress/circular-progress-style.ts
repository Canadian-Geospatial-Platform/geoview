import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '0px',
    bottom: '0px',
    left: '0px',
    right: '0px',
    zIndex: 10000,
    backgroundColor: theme.palette.geoViewColor?.bgColor.dark[900],
    textAlign: 'center',
    transition: theme.transitions.create(['visibility', 'opacity'], {
      delay: theme.transitions.duration.shortest,
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions?.duration?.splash,
    }),
  },
  progress: {
    width: '100px !important',
    height: '100px !important',
    position: 'absolute',
  },
});
