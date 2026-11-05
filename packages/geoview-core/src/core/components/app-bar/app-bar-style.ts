import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the app-bar.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes for app-bar styling
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  appBar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: theme.zIndex.appBar,
    pointerEvents: 'all',
    backgroundColor: theme.palette.surface?.high ?? theme.palette.background.paper,

    '&.interaction-static': {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      backgroundColor: 'unset',
      border: 'unset',
      paddingBottom: theme.spacing(0),
      '&>nav': {
        border: 'unset !important',
        '&>ul>li': {
          backgroundColor: theme.palette.background.paper,
          padding: theme.spacing(0),
          borderRadius: theme.shape.borderRadiusFull,
        },
        '&>ul>li::before': {
          display: 'none',
        },
      },
    },
  },
  appBarList: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '& li': {
      backgroundColor: 'transparent',
      justifyContent: 'center',
    },
  },
  appBarButtons: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    position: 'relative',
    borderRight: `1px solid ${theme.palette.divider}`,
    width: 48,
    '& button': {
      height: '48px',
      width: '48px',
      alignContent: 'center',
      padding: theme.spacing(0),
      borderRadius: theme.shape.borderRadiusNone,
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      transition: theme.transitions.create('background-color', {
        duration: theme.transitions.duration.standard,
        easing: theme.transitions.easing.easeInOut,
      }),
      '& span': {
        margin: theme.spacing(0),
      },
      '& .MuiSvgIcon-root': {
        height: 25,
        width: 25,
      },
      '& .MuiTouchRipple-root': {
        maxWidth: '48px',
      },
      '&[aria-disabled="true"]': {
        color: theme.palette.text.disabled,
        cursor: 'not-allowed',
      },
      // Override global focus indicator for AppBar buttons
      '&.Mui-focusVisible': {
        outlineColor: 'transparent',
        boxShadow: 'none',
      },
    },
  },
  appBarButtonsNotScrollable: {
    paddingTop: theme.spacing(1),
  },
  appBarSeparator: {
    position: 'relative',
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1),
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '4px',
      right: '4px',
      borderTop: `1px solid ${theme.palette.divider}`,
    },
  },
  appBarBottomSection: {
    marginTop: 'auto',
  },
  scrollButtonUp: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  scrollButtonDown: {
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  appBarPanels: {},
});
