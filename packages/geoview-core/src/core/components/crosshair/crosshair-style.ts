import type { Theme } from '@mui/material/styles';
import type { SxStyles } from '@/ui/style/types';

/**
 * Gets custom sx classes for the crosshair.
 *
 * @param theme - The theme object
 * @returns The sx classes object
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  crosshairContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    paddingBottom: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none !important',
    zIndex: theme.zIndex.olControl,
  },
  crosshairInfo: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.5)}`,
    backgroundColor: theme.palette.geoViewColor?.grey.lighten(0.1, 0.8),
  },
  crosshairIcon: {
    width: theme.overrides.crosshairIcon.size.width,
    height: theme.overrides.crosshairIcon?.size.height,
  },
});
