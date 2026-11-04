import type { Theme, SxStyles } from 'geoview-core/ui/style/types';
import { geoViewColors as defaultGeoViewColors } from 'geoview-core/ui/style/default';
import { getFocusIndicatorStyles } from 'geoview-core/ui/style/themeOptionsGenerator';

/**
 * Gets the styles for the 3D panel and its map overlay.
 *
 * @param theme - The MUI theme
 * @returns The panel and overlay styles
 */
export const getSxClasses = (theme: Theme): SxStyles => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
  },
  status: {
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    backgroundColor: theme.palette.background.default,
  },
  attribution: {
    color: theme.palette.text.secondary,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    // Above the OpenLayers viewport, which is positioned absolutely inside the same map target element.
    zIndex: 1,
    backgroundColor: theme.palette.background.default,
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    '&:focus-visible': getFocusIndicatorStyles(theme.palette.geoViewColor ?? defaultGeoViewColors),
  },
});
