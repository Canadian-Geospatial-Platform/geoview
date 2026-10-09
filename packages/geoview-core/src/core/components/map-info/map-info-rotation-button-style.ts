import type { Theme } from '@mui/material/styles';
import type { SxProps, SystemStyleObject } from '@mui/system';

import { geoViewColors as defaultGeoViewColors } from '@/ui/style/default';
import { getFocusIndicatorStyles } from '@/ui/style/themeOptionsGenerator';

/** Style definitions for the map information rotation button. */
interface MapInfoRotationButtonStyles {
  /** Styles for the button container. */
  container: SxProps<Theme>;
  /** Styles for the rotating arrow; kept as a single object for safe sx-array composition. */
  arrow: SystemStyleObject<Theme>;
}

/**
 * Gets custom sx classes for the map information rotation button.
 *
 * @param theme - The MUI theme
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): MapInfoRotationButtonStyles => ({
  container: {
    color: theme.palette.geoViewColor?.bgColor.light[800],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:focus-visible': {
      borderRadius: theme.shape.borderRadiusSm,
      ...getFocusIndicatorStyles(theme.palette.geoViewColor ?? defaultGeoViewColors),
      outlineOffset: 0,
      boxShadow: 'none',
    },
  },
  arrow: {
    transition: 'transform 0.3s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
