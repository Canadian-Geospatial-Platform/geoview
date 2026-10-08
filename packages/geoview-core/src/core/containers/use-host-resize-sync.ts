import { useEffect } from 'react';

import { getStoreAppHeight } from '@/core/stores/states/app-state';
import { logger } from '@/core/utils/logger';

/** Props for the useHostResizeSync hook. */
interface UseHostResizeSyncProps {
  /** The map identifier. */
  mapId: string;
  /** The root GeoView element whose authored height drives the viewer height. */
  geoviewElement: HTMLElement;
  /** Whether the map is displayed in fullscreen mode. */
  isMapFullScreen: boolean;
  /** The host inline height captured before it was overridden with 'fit-content', if overridden. */
  hostOriginalHeightRef: React.RefObject<string | undefined>;
  /** Callback invoked with the new viewer height when the host height changes. */
  onHostHeightChange: (height: number) => void;
}

/**
 * Measures the height the host element would have from its own CSS, ignoring its content.
 *
 * The host may be forced to 'fit-content' to accommodate the footer bar, so its authored height
 * (e.g. 100% or 100vh) is temporarily restored with size containment to read the value. Size
 * containment makes content-sized (auto) hosts measure 0, which prevents a feedback loop where
 * the viewer grows with its own content.
 *
 * @param geoviewElement - The root GeoView element
 * @param originalHeight - The host inline height captured before the 'fit-content' override, if any
 * @returns The measured height in pixels, or 0 when the host height depends on its content
 */
const measureHostHeight = (geoviewElement: HTMLElement, originalHeight: string | undefined): number => {
  const { style } = geoviewElement;
  const { height, transition, contain } = style;

  style.transition = 'none';
  style.contain = 'size';
  style.height = originalHeight ?? height;
  const measuredHeight = geoviewElement.clientHeight;

  style.height = height;
  style.contain = contain;
  // Flush layout before restoring the transition so the restore is not animated
  geoviewElement.offsetHeight;
  style.transition = transition;

  return measuredHeight;
};

/**
 * Hook that keeps the stored viewer height in sync with the host element when an external layout resizes it.
 *
 * Observes the host and its parent (plus window resizes for viewport-relative heights) and reports the new
 * height only when it differs from the stored one. Fullscreen sizing is handled separately and is skipped.
 *
 * @param props - The hook configuration properties
 */
export const useHostResizeSync = ({
  mapId,
  geoviewElement,
  isMapFullScreen,
  hostOriginalHeightRef,
  onHostHeightChange,
}: UseHostResizeSyncProps): void => {
  /**
   * Observes the host and its parent to update the viewer height when the external layout changes.
   */
  useEffect(() => {
    logger.logTraceUseEffect('USE HOST RESIZE SYNC - observe host element size', mapId, isMapFullScreen);

    if (isMapFullScreen) return undefined;

    const syncHostHeight = (): void => {
      const measuredHeight = measureHostHeight(geoviewElement, hostOriginalHeightRef.current);
      if (measuredHeight > 0 && measuredHeight !== getStoreAppHeight(mapId)) onHostHeightChange(measuredHeight);
    };

    // Defer to the next frame: resizing the observed host inside the observer callback triggers the
    // 'ResizeObserver loop completed with undelivered notifications' error
    let frameId: number | undefined;
    const scheduleSyncHostHeight = (): void => {
      if (frameId !== undefined) return;
      frameId = requestAnimationFrame(() => {
        frameId = undefined;
        syncHostHeight();
      });
    };

    syncHostHeight();

    window.addEventListener('resize', scheduleSyncHostHeight);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleSyncHostHeight);
      resizeObserver.observe(geoviewElement);
      if (geoviewElement.parentElement) resizeObserver.observe(geoviewElement.parentElement);
    }

    return (): void => {
      window.removeEventListener('resize', scheduleSyncHostHeight);
      resizeObserver?.disconnect();
      if (frameId !== undefined) cancelAnimationFrame(frameId);
    };
  }, [mapId, geoviewElement, isMapFullScreen, hostOriginalHeightRef, onHostHeightChange]);
};
