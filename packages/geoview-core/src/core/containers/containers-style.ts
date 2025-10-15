import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the focus trap container
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getFocusTrapSxClasses = (theme: Theme): SxStyles => {
  return {
    trap: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: theme.spacing(0),
      left: theme.spacing(0),
      width: '100%',
      zIndex: theme.zIndex.focusDialog,
      overflow: 'hidden',
    },
  };
};

/**
 * Get custom sx classes for the shell container
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getShellSxClasses = (theme: Theme, appHeight: number): SxStyles => ({
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
      background: theme.palette.geoViewColor.secondary.darken(0.5, 0.5),
      borderRadius: '5px',
    },
    '& *::-webkit-scrollbar-thumb': {
      background: theme.palette.geoViewColor.secondary.darken(0.5),
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
    scrollMarginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    top: theme.spacing(0),
    right: theme.spacing(0),
    left: theme.spacing(0),
    bottom: theme.spacing(0),
    overflow: 'clip',
    zIndex: 0,
    height: '100%',
  },
  mapShellContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: `${appHeight}px`,
    width: '100%',
    position: 'relative',
    alignItems: 'stretch',
    zIndex: 0,
  },
  mapContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
