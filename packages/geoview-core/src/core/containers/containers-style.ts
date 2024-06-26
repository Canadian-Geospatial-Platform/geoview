import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFocusTrapSxClasses = (theme: Theme): any => {
  const borderColor =
    theme.palette.mode === 'light' ? theme.palette.geoViewColor.primary.dark[300] : theme.palette.geoViewColor.primary.light[300];

  return {
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
    exitFocus: {
      border: 'unset',
    },
    enableFocus: {
      border: `5px solid ${borderColor}
      }`,
    },
  };
};

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getShellSxClasses = (theme: Theme): any => ({
  all: {
    height: '100%',
    width: '100%',

    '& .layer-icon': {
      padding: 3,
      borderRadius: 0,
      border: '1px solid',
      borderColor: theme.palette.geoViewColor.grey.dark[100],
      boxShadow: 2,
      background: theme.palette.geoViewColor.white,
      objectFit: 'scale-down',
      width: '35px',
      height: '35px',
      marginRight: '10px',
    },

    '& a[href]': {
      color: theme.palette.geoViewColor.primary.main,
      '*:hover': {
        color: theme.palette.geoViewColor.primary.dark[300],
      },
    },

    '& *::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '& *::-webkit-scrollbar-track': {
      background: theme.palette.geoViewColor.bgColor.darken(0.5, 0.5),
      borderRadius: '5px',
    },
    '& *::-webkit-scrollbar-thumb': {
      background: theme.palette.geoViewColor.bgColor.darken(0.5),
      borderRadius: '5px',
    },

    '.bordered': {
      border: `1px solid ${theme.palette.geoViewColor.bgColor.darken(0.5, 0.5)}`,
      boxShadow: `0px 12px 9px -13px ${theme.palette.geoViewColor.bgColor.darken(0.2, 0.5)}`,
    },
    '.bordered-primary': {
      border: `1px solid ${theme.palette.geoViewColor.primary.darken(0.1, 0.9)}`,
      boxShadow: `0px 12px 9px -13px ${theme.palette.geoViewColor.bgColor.dark[200]}`,
    },
  },
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
  mapShellContainer: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: '100%',
    width: '100%',
    position: 'relative',
    alignItems: 'stretch',
  },
  mapContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    width: '100%',
    position: 'relative',
    alignItems: 'stretch',
  },
  skip: {
    position: 'absolute',
    left: -1000,
    height: '1px',
    width: '1px',
    textAlign: 'left',
    overflow: 'hidden',
    backgroundColor: theme.palette.geoViewColor.white,
    zIndex: theme.zIndex.tooltip,

    '&:active, &:focus': {
      left: theme.spacing(0),
      zIndex: theme.zIndex.tooltip,
      width: 'auto',
      height: 'auto',
      overflow: 'visible',
    },
  },
});
