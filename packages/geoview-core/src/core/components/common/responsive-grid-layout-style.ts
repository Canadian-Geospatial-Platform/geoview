import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 *  Get custom sx classes for the common grid layout
 *
 * @param {Theme} theme - The MUI theme object containing styling configurations
 * @returns {SxStyles} An object containing MUI SX styling properties
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px 0',
    gap: '10px',
  },
  topRow: {
    '& .responsive-layout-left-top': {
      alignItems: 'end',
      width: '100%',
      '&.MuiGrid-grid-xs-auto': {
        width: '100%',
      },
    },
    '& .responsive-layout-right-top': {
      alignItems: 'end',
      '&.MuiGrid-grid-xs-auto': {
        width: '100%',
      },
    },
  },
  rightButtonsContainer: {
    alignSelf: 'end',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[300],
    display: 'flex',
    flexDirection: 'row',
    gap: '0.6rem',
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem',
    borderTop: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderLeft: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    borderRight: `2px solid ${theme.palette.geoViewColor.primary.main}`,
    '& .MuiButton-startIcon': {
      [theme.breakpoints.down('md')]: {
        margin: 0,
      },
    },
    '& .MuiButtonBase-root': {
      borderTop: 0,
      borderBottom: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      '&.active': {
        backgroundColor: theme.palette.geoViewColor.primary.main,
        color: theme.palette.geoViewColor.white,
        boxShadow: 1,
      },
    },
    '& .MuiButtonGroup-firstButton': {
      borderLeft: 0,
    },
    '& .MuiButtonGroup-lastButton': {
      borderRight: 0,
    },
  },
  rightMainContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    '&:focus-visible': {
      border: '2px solid inherit',
    },

    '& .MuiPaper-root': {
      border: 'none',
    },
    '& .guideBox': {
      position: 'relative',
      color: `${theme.palette.geoViewColor.grey.dark[800]}  !important`,
      padding: '16px',
      img: {
        maxWidth: '100%',
      },
      td: {
        width: 'auto',
        paddingLeft: '15px',
      },
      th: {
        textAlign: 'left',
        paddingLeft: '15px',
      },
      '& h4': {
        borderBottom: 'none',
      },
    },
    '&.fullscreen-mode': {
      a: {
        color: theme.palette.geoViewColor.primary.main,
        '&:hover': {
          color: theme.palette.geoViewColor.primary.dark[300],
        },
      },
    },
    '& .noSelection': {
      fontSize: theme.palette.geoViewFontSize.md,
      fontWeight: '500',
      padding: 10,
    },
    '& .guide-button-container': {
      display: 'flex',
      justifyContent: 'flex-end',
      border: 'none',
      borderRadius: '0',
    },
    '& .guide-button-group': {
      border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
      borderBottom: 'none',
      borderRadius: '8px 8px 0 0',
    },
    '& .panel-content-container': {
      backgroundColor: theme.palette.geoViewColor.white,
      minHeight: '0',
      border: `2px solid ${theme.palette.geoViewColor.primary.main}`,
      borderRadius: '5px 0 5px 5px',
      overflow: 'auto',
    },
  },
  gridRightMain: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
  gridLeftMain: {
    height: '100%',
    overflowY: 'auto',
    marginTo: '30px',
    '&.MuiGrid-grid-xs-auto': {
      '& .layer-panel': {
        width: '52px',
      },
      '& .MuiListItemButton-root': {
        justifyContent: 'center',
        padding: '0 8px',
        minHeight: '48px',
        '& .layer-count': {
          display: 'block',
        },
        '& .layerInfo': {
          display: 'none',
        },
      },
    },
  },
});
