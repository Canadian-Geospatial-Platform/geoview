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
  bellButtonContainerDynamic: {
    padding: theme.spacing(0),
  },
  bellButtonContainerStatic: {
    padding: theme.spacing(0.5),
  },
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
    marginLeft: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    boxShadow: 2,
  },
  notificationsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: '48px',
    minWidth: 0,
    padding: theme.spacing(0.5, 1, 0.5, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    gap: theme.spacing(2),
  },
  notificationsTitle: {
    fontSize: theme.typography.h6.fontSize,
    fontWeight: '700',
    color: theme.palette.text.primary,
  },
  notificationsFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: theme.spacing(1, 1, 1, 2),
    borderTop: `1px solid ${theme.palette.divider}`,
    minWidth: 0,
    minHeight: '48px',
  },
  skipLink: {
    ...visuallyHidden,
    backgroundColor: theme.palette.background.paper,
    zIndex: theme.zIndex.tooltip,
    '&:active, &:focus': {
      position: 'absolute',
      display: 'inline-block',
      left: '1px',
      top: '40px',
      zIndex: theme.zIndex.tooltip,
      width: 'auto',
      height: 'auto',
      clip: 'auto',
      margin: theme.spacing(0),
      padding: theme.spacing(0.25),
      textDecoration: 'underline',
      overflow: 'visible',
      whiteSpace: 'normal',
    },
  },
  notificationsList: {
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarGutter: 'stable',
    padding: theme.spacing(1),
    scrollbarWidth: 'thin',
  },
  notificationItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    minWidth: 0,
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  notificationsItemMsg: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.text.primary,
    margin: theme.spacing(0),
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  notificationsItemButton: {
    marginLeft: 'auto',
  },
  notificationsItemCount: {
    display: 'inline-block',
    padding: theme.spacing(0, 2),
    backgroundColor: theme.palette.inverseContent?.surface ?? theme.palette.grey[900],
    color: theme.palette.inverseContent?.text ?? theme.palette.common.white,
    fontSize: theme.typography.body2.fontSize,
    borderRadius: theme.shape.borderRadiusFull,
    height: '20px',
    lineHeight: '20px',
    textAlign: 'center',
  },
  emptyMessage: {
    padding: theme.spacing(2, 2),
  },
});
