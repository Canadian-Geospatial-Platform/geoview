import { Theme } from '@mui/material/styles';

export const getSxClasses = (theme: Theme) => ({
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
  notificationsTitle: {
    fontSize: '15px',
    fontWeight: '700',
    padding: '10px',
    color: theme.palette.geoViewColor.textColor.main,
    borderBottom: `1px solid ${theme.palette.geoViewColor.bgColor.dark[300]}}`,
    marginBottom: '10px',
  },
  notificationsList: {
    overflowY: 'auto',
    padding: '0px 0px 10px 0px',
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
    fontSize: '12px',
    borderRadius: '10px',
    height: '20px',
    width: '40px',
    textAlign: 'center',
    lineHeight: '20px',
  },
});
