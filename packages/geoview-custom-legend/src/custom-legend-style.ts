import { Theme } from '@mui/material';

export const getSxClasses = (theme: Theme) => ({
  legendCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '4px',
    boxShadow: theme.shadows[1],
  },
  legendIcon: {
    width: '24px',
    height: '24px',
    objectFit: 'contain',
  },
});
