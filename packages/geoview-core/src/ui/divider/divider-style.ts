import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the divider component.
 *
 * @param theme - The MUI theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  vertical: {
    alignSelf: 'center',
    height: 40,
    width: '1px !important',
    backgroundColor: theme.palette.primary.contrastText,
  },
  horizontal: {
    height: 1,
    backgroundColor: theme.palette.primary.contrastText,
  },
  grow: {
    flexGrow: 1,
    backgroundColor: theme.palette.geoViewColor?.primary.main,
  },
});
