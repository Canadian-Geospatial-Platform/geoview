import type { Theme, SxStyles } from 'geoview-core/ui/style/types';
import { geoViewColors as defaultGeoViewColors } from 'geoview-core/ui/style/default';
import { getFocusIndicatorStyles } from 'geoview-core/ui/style/themeOptionsGenerator';

/**
 * Gets the styles for the 3D panel.
 *
 * @param theme - The MUI theme
 * @returns The panel styles
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '320px',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    '&:focus-visible': getFocusIndicatorStyles(theme.palette.geoViewColor ?? defaultGeoViewColors),
  },
  status: {
    position: 'absolute',
    left: theme.spacing(1),
    bottom: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    backgroundColor: theme.palette.background.paper,
  },
});
