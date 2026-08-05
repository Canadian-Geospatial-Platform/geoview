import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

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
    transition: `${theme.transitions.duration.standard}ms ease`,
    position: 'absolute',
    left: `${appBarWidth}px`,
  },
  panelCard: {
    backgroundColor: theme.palette.geoViewColor?.bgColor.main,
    height: '100%',
    borderRadius: 0,
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      minWidth: '100%',
    },
    '& .MuiCardHeader-root': {
      backgroundColor: theme.palette.geoViewColor?.bgColor.dark[50],
      borderBottomColor: theme.palette.geoViewColor?.bgColor.dark[100],
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      height: 48,
    },
    '& .MuiCardHeader-title': {
      fontSize: theme.palette.geoViewFontSize?.default,
      lineHeight: 1.25,
      paddingTop: 0,
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
      marginTop: '-10px',
      '& .MuiButtonBase-root': {
        border: `1px solid ${theme.palette.geoViewColor?.primary.main}`,
        height: 36,
        width: 36,
        marginRight: 8,
        transition: 'all 0.3s ease-in-out',
        '& .MuiSvgIcon-root': {
          width: 24,
          height: 24,
        },
        '&:last-child': {
          marginRight: 0,
        },
        '&:hover': {
          backgroundColor: theme.palette.geoViewColor?.bgColor.dark[100],
        },
      },
    },
  },
  panelCardContent: {
    padding: '0px',
    position: 'relative',
    overflow: 'hidden',
    '&:last-child': {
      paddingBottom: 0,
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
