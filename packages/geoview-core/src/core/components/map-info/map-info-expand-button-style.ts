import type { Theme } from '@mui/material/styles';

import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the map information expand button.
 *
 * @param theme - The MUI theme
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    color: theme.palette.geoViewColor?.bgColor.dark[650],
    width: 30,
    height: 30,
  },
});
