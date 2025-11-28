import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Get custom sx classes for the notification
 *
 * @param {Theme} theme the theme object
 * @returns {Object} the sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  notificationPanel: {
    display: 'flex',
    flexDirection: 'column',
    width: '350px',
    maxHeight: '500px',
    overflowY: 'hidden',
    marginLeft: '15px',
    backgroundColor: theme.palette.geoViewColor.bgColor.light[200],
    borderRadius: '5px',
    boxShadow: 2,
  },
  notificationsHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[100]}`,
  },
  notificationsTitle: {
    fontSize: theme.palette.geoViewFontSize.default,
    fontWeight: '700',
    color: theme.palette.geoViewColor.textColor.main,
  },
  notificationsList: {
    overflowY: 'auto',
    padding: '0 10px',
  },
  notificationItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 0',

    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}`,
    },

    '& .MuiIconButton-root': {
      color: theme.palette.geoViewColor.textColor.lighten(0.2, 0.4),
      '&:hover': {
        color: theme.palette.geoViewColor.textColor.lighten(0.2, 0.6),
      },
    },
  },
  notificationsItemMsg: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    flexGrow: '1',
    fontSize: theme.palette.geoViewFontSize.sm,
    color: theme.palette.geoViewColor.textColor.light[250],
    margin: '0',
    '& span': {
      flexGrow: '1',
      display: 'inline-block',
      backgroundColor: theme.palette.geoViewColor.bgColor.dark[800],
      color: theme.palette.geoViewColor.bgColor.light[800],
      fontSize: theme.palette.geoViewFontSize.sm,
      borderRadius: '10px',
      height: '20px',
      padding: '0 16px',
      textAlign: 'center',
      lineHeight: '20px',
    },
  },
});
