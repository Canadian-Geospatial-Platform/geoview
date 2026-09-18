import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the common grid layout.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: theme.spacing(2, 0),
    gap: theme.spacing(1.25),
  },
  guideCloseBtn: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    zIndex: 1000,
  },
  /** App bar guide sits below a taller header, so the close button needs extra top offset. */
  guideCloseBtnAppBar: {
    top: '32px',
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
    backgroundColor: theme.palette.geoViewColor?.bgColor.light[300],
    '& .MuiButton-startIcon': {
      [theme.breakpoints.down('md')]: {
        margin: theme.spacing(0),
      },
    },
    '& .MuiButtonBase-root': {
      borderTop: 0,
      borderBottom: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      '&.active': {
        backgroundColor: theme.palette.geoViewColor?.primary.main,
        color: theme.palette.geoViewColor?.white,
        boxShadow: 1,
      },
      '&.Mui-focusVisible': {
        outlineOffset: '-2px',
        boxShadow: 'none',
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
      color: `${theme.palette.geoViewColor?.grey.dark[800]}  !important`,
      padding: theme.spacing(2),
      img: {
        maxWidth: '100%',
      },
      td: {
        width: 'auto',
        paddingLeft: theme.spacing(2),
      },
      th: {
        textAlign: 'left',
        paddingLeft: theme.spacing(2),
      },
      '& h4': {
        borderBottom: 'none',
      },
    },
    '&.fullscreen-mode': {
      a: {
        color: theme.palette.geoViewColor?.primary.main,
        '&:hover': {
          color: theme.palette.geoViewColor?.primary.dark[300],
        },
      },
    },
    '& .noSelection': {
      fontSize: theme.palette.geoViewFontSize?.md,
      fontWeight: '500',
      padding: theme.spacing(2),
    },
    '& .panel-content-container': {
      backgroundColor: theme.palette.geoViewColor?.white,
      minHeight: '0',
      border: `2px solid ${theme.palette.geoViewColor?.primary.main}`,
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
  guideButtonGroup: {
    border: `2px solid ${theme.palette.geoViewColor?.primary.main}`,
    borderBottom: 'none',
    borderRadius: '8px 8px 0 0',
  },
  gridLeftMain: {
    height: '100%',
    overflowY: 'auto',
    paddingTop: theme.spacing(3.75), // To align left list with right panel box and leave room for focus indicator (below 30px right panel toolbar)
    paddingBottom: theme.spacing(3), // To ensure last item can be fully scrolled up to be fully visible (snapped from 25px)
    '&.MuiGrid-grid-xs-auto': {
      '& .layer-panel': {
        width: '52px',
      },
      '& .MuiListItemButton-root': {
        justifyContent: 'center',
        padding: theme.spacing(0, 1),
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
