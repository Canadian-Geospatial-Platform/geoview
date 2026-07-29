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
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
    border: theme.palette.geoViewColor?.primary.light[100],

    '&.interaction-static': {
      position: 'absolute',
      left: 0,
      top: 0,
      height: '100%',
      backgroundColor: 'unset',
      border: 'unset',
      paddingBottom: '0px',
      '&>nav': {
        border: 'unset !important',
        '&>div>ul>li': {
          backgroundColor: theme.palette.geoViewColor?.grey.lighten(0.8, 0.8),
          padding: '0px',
          borderRadius: '50%',
        },
        '&>div>ul>li::before': {
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
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    '& li': {
      backgroundColor: 'transparent',
      justifyContent: 'center',
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
  appBarButtons: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    position: 'relative',
    borderRightColor: theme.palette.geoViewColor?.primary.light[100],
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    width: 50,
    '& button': {
      height: '54px',
      width: '50px',
      minWidth: '40px',
      alignContent: 'center',
      padding: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      color: theme.palette.geoViewColor?.primary.main,
      transition: 'background-color 0.3s ease-in-out',
      '& span': {
        margin: 0,
      },
      '& .MuiSvgIcon-root': {
        height: 25,
        width: 25,
      },
      '& .MuiTouchRipple-root': {
        maxWidth: '50px',
      },
      '&[aria-disabled="true"]': {
        color: theme.palette.geoViewColor?.bgColor.dark[450],
        cursor: 'not-allowed',
      },
    },
  },
  appBarSeparator: {
    position: 'relative',
    marginTop: '0.5em',
    paddingTop: '0.5em',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '4px',
      right: '4px',
      borderTop: `1px solid ${theme.palette.geoViewColor?.grey.light[100]}`,
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
