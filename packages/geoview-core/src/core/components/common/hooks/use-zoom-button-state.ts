import { useCallback, useState } from 'react';
import { equals } from 'ol/extent';

import type { Extent } from '@/api/types/map-schema-types';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { getStoreMapExtent, useStoreMapExtent } from '@/core/stores/states/map-state';

/** The state of a zoom button, as returned by `useZoomButtonState`. */
export type TypeZoomButtonState = {
  /** Whether the map still shows the view of the last zoom to the current target (a new click would have no effect). */
  isZoomed: boolean;
  /** Records that the zoom to a target completed; call it once the zoom promise resolved. */
  markZoomed: (zoomedTargetKey: string) => void;
};

/**
 * Custom hook tracking whether a zoom button's last zoom is still the current map view, so the button can be
 * aria-disabled until the map view changes (a second click would have no effect).
 *
 * The map view is identified by the store map extent, updated on every map move end (pan, zoom, resize), and compared
 * by value so coming back to the exact same view still counts as unchanged. The button becomes available again as soon
 * as the map view or its target changes. Call the hook where it survives target navigation (e.g. the panel, not a
 * per-target component), otherwise the last zoom is forgotten when the target component is recreated.
 *
 * @param targetKey - Identifies what the button zooms to (e.g. a feature or a result group); another key re-enables the button
 * @returns The zoom button state
 */
export function useZoomButtonState(targetKey: string): TypeZoomButtonState {
  // Store
  const mapId = useStoreGeoViewMapId();
  const mapExtent = useStoreMapExtent();

  // State
  const [zoomedView, setZoomedView] = useState<{ targetKey: string; extent: Extent | undefined }>();

  /**
   * Records the view the zoom ended on; the store getter is used because the move end already updated the store
   * when the zoom promise resolves, before this component re-renders with the new extent.
   */
  const markZoomed = useCallback(
    (zoomedTargetKey: string): void => {
      setZoomedView({ targetKey: zoomedTargetKey, extent: getStoreMapExtent(mapId) });
    },
    [mapId]
  );

  const isZoomed =
    zoomedView?.targetKey === targetKey && !!zoomedView.extent && !!mapExtent && equals(zoomedView.extent, mapExtent);
  return { isZoomed, markZoomed };
}
