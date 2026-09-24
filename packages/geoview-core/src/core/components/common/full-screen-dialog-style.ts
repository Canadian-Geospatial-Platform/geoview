import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the full-screen dialog.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  closeButton: {
    margin: theme.spacing(1.25),
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.geoViewColor?.bgColor.dark[300] ?? theme.palette.divider}`,
  },
  dialogTitle: {
    fontSize: theme.palette.geoViewFontSize?.lg,
    fontWeight: '600',
  },
});
