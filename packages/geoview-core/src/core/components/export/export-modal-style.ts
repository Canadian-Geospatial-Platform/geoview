import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

export const getSxClasses = (theme: Theme): SxStyles => ({
  title: {
    marginBottom: 2,
    textAlign: 'center',
  },

  titleInput: {
    minWidth: 300,
  },

  mapPreview: {
    width: 600,
    height: 777,
    border: '1px solid #ccc',
  },

  mapSkeletonMargin: {
    margin: '0 auto',
  },

  mapLoading: {
    width: 600,
    height: 777,
    border: '1px solid #ccc',
    margin: '0 auto',
  },

  dialogActions: {
    padding: '1rem',
    gap: '0.5rem',
  },

  buttonOutlined: {
    fontSize: theme.palette.geoViewFontSize.sm,
    padding: '0.7rem 1rem',
    height: '47px',
    borderColor: theme.palette.geoViewColor.primary.main,
    color: theme.palette.geoViewColor.primary.main,
    '&:hover': {
      borderColor: theme.palette.geoViewColor.primary.dark[200],
      backgroundColor: theme.palette.geoViewColor.primary.light[100],
    },
  },

  buttonContained: {
    fontSize: theme.palette.geoViewFontSize.sm,
    padding: '0.7rem 1rem',
    backgroundColor: theme.palette.geoViewColor.primary.main,
    height: '47px',
    '&:hover': {
      backgroundColor: theme.palette.geoViewColor.primary.dark[200],
    },
  },
});
