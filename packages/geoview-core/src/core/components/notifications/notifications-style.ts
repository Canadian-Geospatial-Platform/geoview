import { Theme } from '@mui/material/styles';

// ? I doubt we want to define an explicit type for style properties?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSxClasses = (theme: Theme): any => ({
  notificationPanel: {
    display: 'flex',
    flexDirection: 'column',
    width: '350px',
    maxHeight: '500px',
    overflowY: 'hidden',
    gap: '8px',
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
    padding: '20px',
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}}`,
  },
  notificationsTitle: {
    fontSize: theme.palette.geoViewFontSize.default,
    fontWeight: '700',
    color: theme.palette.geoViewColor.textColor.main,
  },
  notificationsList: {
    overflowY: 'auto',
    padding: '0px 0px 20px 0px',
  },
  notificationItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 15px',

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
  notificationsCount: {
    backgroundColor: theme.palette.geoViewColor.bgColor.dark[800],
    color: theme.palette.geoViewColor.bgColor.light[800],
    fontSize: theme.palette.geoViewFontSize.sm,
    borderRadius: '10px',
    height: '20px',
    width: '40px',
    textAlign: 'center',
    lineHeight: '20px',
  },
});
