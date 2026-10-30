import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { geoViewColors as defaultGeoViewColors } from '@/ui/style/default';
import { FOCUS_OUTLINE_WIDTH, getFocusIndicatorStyles } from '@/ui/style/themeOptionsGenerator';

/** Theme-independent top-panel styles, passed as objects to ResponsiveGrid panels. */
export const TOP_PANEL_STYLES = {
  left: { zIndex: 200 },
  right: { zIndex: 100, alignContent: 'flex-end' },
  leftFullscreen: { zIndex: 'unset' },
  rightFullscreen: { zIndex: 'unset', alignContent: 'flex-end' },
} satisfies SxStyles;

/**
 * Gets custom sx classes for the common grid layout.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  rightTopContent: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing(0),
    [theme.breakpoints.up('sm')]: {
      justifyContent: 'right',
    },
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'space-between',
    },
    width: '100%',
  },
  rightTopContentAppBar: {
    alignItems: 'end',
    flexDirection: 'column',
    gap: '10px',
    [theme.breakpoints.up('sm')]: {
      justifyContent: 'space-between',
    },
  },
  enlargeButton: {
    boxShadow: 'none',
  },
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
    backgroundColor: theme.palette.background.paper,
    '& .MuiButton-startIcon': {
      [theme.breakpoints.down('md')]: {
        margin: theme.spacing(0),
      },
    },
    '& .MuiButtonBase-root': {
      borderTop: 0,
      borderBottom: 0,
      borderBottomLeftRadius: theme.shape.borderRadiusNone,
      borderBottomRightRadius: theme.shape.borderRadiusNone,
      '&.active': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
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
    '& .MuiPaper-root': {
      border: 'none',
    },
    '&.fullscreen-mode': {
      a: {
        color: theme.palette.primary.main,
        '&:hover': {
          color: theme.palette.primary.dark,
        },
      },
    },
    '& .noSelection': {
      fontSize: theme.typography.body2.fontSize,
      fontWeight: '500',
      padding: theme.spacing(2),
    },
    '& .panel-content-container': {
      backgroundColor: theme.palette.background.paper,
      flex: '1 1 0%', // Fill the remaining height so children (e.g. data table) can size to it and keep their scrollbars inside the panel
      minHeight: '0',
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: `${theme.shape.borderRadiusMd} ${theme.shape.borderRadiusNone} ${theme.shape.borderRadiusMd} ${theme.shape.borderRadiusMd}`,
      overflow: 'auto',
      overscrollBehaviorY: 'contain', // Prevent scrolling the page when the panel reaches its top or bottom.
      '&:focus-visible': {
        ...getFocusIndicatorStyles(theme.palette.geoViewColor ?? defaultGeoViewColors),
        outlineOffset: `-${FOCUS_OUTLINE_WIDTH}`,
        boxShadow: 'none',
      },
    },
  },
  gridRightMain: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
  guideButtonGroup: {
    border: `2px solid ${theme.palette.primary.main}`,
    borderBottom: 'none',
    borderRadius: `${theme.shape.borderRadiusMd} ${theme.shape.borderRadiusMd} ${theme.shape.borderRadiusNone} ${theme.shape.borderRadiusNone}`,
  },
  gridLeftMain: {
    height: '100%',
    overflowY: 'auto',
    paddingTop: theme.spacing(3.75), // To align left list with right panel box and leave room for focus indicator (below 30px right panel toolbar)
    paddingBottom: theme.spacing(3), // To ensure last item can be fully scrolled up to be fully visible
  },
});
