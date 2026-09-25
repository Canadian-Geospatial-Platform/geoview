import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the layers toolbar component.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    '&>button': { padding: theme.spacing(1.25, 2) },
    '& .MuiButton-startIcon': { [theme.breakpoints.down('sm')]: { margin: theme.spacing(0), padding: theme.spacing(0, 0.5) } },
    '& .MuiButtonGroup-root': { backgroundColor: theme.palette.geoViewColor?.bgColor.light[300] },
  },
  /** Enlarges and centers the add-layer icon when the label is hidden by makeResponsive. */
  addButton: {
    '& .MuiButton-startIcon svg': { fontSize: theme.palette.geoViewFontSize?.sm },
    [theme.breakpoints.down('md')]: {
      '& .MuiButton-startIcon': { margin: theme.spacing(0) },
      '& .MuiButton-startIcon svg': { fontSize: theme.palette.geoViewFontSize?.xl },
    },
  },
});
