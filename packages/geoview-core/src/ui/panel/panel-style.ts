import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { GEOVIEW_SHAPE } from '@/ui/style/default';

/** Width of the app-bar used to offset panel positioning. */
const appBarWidth = 48;

/**
 * Gets custom sx classes for the panel component.
 *
 * @param theme - The MUI theme object
 * @param open - Whether the panel is currently open
 * @param panelWidth - The panel width as percentage or pixel value
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme, open: boolean, panelWidth: string | number): SxStyles => ({
  panelContainer: {
    height: `calc(100% - 40px)`,
    width: open ? `calc(${panelWidth}% - ${appBarWidth}px)` : 0,
    [theme.breakpoints.up('sm')]: {
      minWidth: open ? '420px' : 0,
    },
    [theme.breakpoints.down('sm')]: {
      width: open ? `calc(100% - ${appBarWidth}px)` : 0,
    },
    transition: theme.transitions.create('all', {
      duration: theme.transitions.duration.standard,
      easing: theme.transitions.easing.easeInOut,
    }),
    position: 'absolute',
    left: `${appBarWidth}px`,
  },
  panelCard: {
    backgroundColor: theme.palette.surface?.high ?? theme.palette.background.paper,
    height: '100%',
    borderRadius: GEOVIEW_SHAPE.borderRadiusNone,
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      minWidth: '100%',
    },
    '& .MuiCardHeader-root': {
      backgroundColor: theme.palette.surface?.low ?? theme.palette.background.default,
      borderBottomColor: theme.palette.divider,
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      height: 48,
      gap: theme.spacing(0.5),
    },
    '& .MuiCardHeader-title': {
      fontSize: theme.typography.h6.fontSize,
      lineHeight: 1.25,
      paddingTop: theme.spacing(0),
      textTransform: 'uppercase',
      opacity: 0,
      animation: 'fadein 500ms ease-in-out forwards',
      animationDelay: '300ms',
      '@keyframes fadein': {
        from: {
          opacity: 0,
        },
        to: {
          opacity: 1,
        },
      },
    },
    '& .MuiCardHeader-action': {
      alignSelf: 'center',
      '& .MuiButtonBase-root': {
        border: `1px solid ${theme.palette.primary.main}`,
        height: 36,
        width: 36,
        transition: theme.transitions.create('all', {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
        '& .MuiSvgIcon-root': {
          width: 24,
          height: 24,
        },
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      },
    },
  },
  panelCardContent: {
    padding: theme.spacing(0),
    position: 'relative',
    overflow: 'hidden',
    '&:last-child': {
      paddingBottom: theme.spacing(0),
    },
    height: 'calc(100% - 48px)',
    opacity: 0,
    animation: 'fadein 500ms ease-in-out forwards',
    animationDelay: '400ms',
    '@keyframes fadein': {
      from: {
        opacity: 0,
      },
      to: {
        opacity: 1,
      },
    },
  },
});
