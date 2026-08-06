import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';
import { visuallyHidden } from '@/ui/style/default';

/**
 * Gets custom sx classes for the notification.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  popper: {
    pointerEvents: 'auto',
    zIndex: theme.zIndex.modal,
  },
  popoverPaper: {
    display: 'flex',
    flexDirection: 'column',
    width: '340px',
    minWidth: '180px',
    maxWidth: '70vw',
    maxHeight: 'min(100vh, 500px)',
    marginLeft: theme.spacing(6),
    backgroundColor: theme.palette.geoViewColor?.bgColor.light[200],
    borderRadius: '5px',
    boxShadow: 2,
  },
  notificationsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '48px',
    minWidth: 0,
    padding: '4px 8px 4px 16px',
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100]}`,
    gap: '16px',
  },
  notificationsTitle: {
    fontSize: theme.palette.geoViewFontSize?.default,
    fontWeight: '700',
    color: theme.palette.geoViewColor?.textColor.main,
  },
  notificationsFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '8px 8px 8px 16px',
    borderTop: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[100]}`,
    minWidth: 0,
    minHeight: '48px',
  },
  skipLink: {
    ...visuallyHidden,
    backgroundColor: theme.palette.geoViewColor?.white,
    zIndex: theme.zIndex.tooltip,
    '&:active, &:focus': {
      position: 'absolute',
      display: 'inline-block',
      left: theme.spacing(1),
      top: '40px',
      zIndex: theme.zIndex.tooltip,
      width: 'auto',
      height: 'auto',
      clip: 'auto',
      margin: 0,
      padding: theme.spacing(1),
      textDecoration: 'underline',
      overflow: 'visible',
      whiteSpace: 'normal',
    },
  },
  notificationsList: {
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarGutter: 'stable',
    padding: '8px 16px',
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.palette.geoViewColor?.primary.main ?? theme.palette.primary.main} transparent`,
  },
  notificationItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0 8px 8px',
    minWidth: 0,
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[300]}`,
    },
  },
  notificationsItemMsg: {
    fontSize: theme.palette.geoViewFontSize?.sm,
    color: theme.palette.geoViewColor?.textColor.light[250],
    margin: '0',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  emptyMessage: {
    padding: '16px 16px',
  },
});
