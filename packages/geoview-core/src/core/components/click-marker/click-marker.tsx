import { useEffect, useRef, memo } from 'react';

import type { Coordinate } from 'ol/coordinate';
import { Box, ClickMapMarker } from '@/ui';

import { useMapClickMarker, useMapClickCoordinates, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

/** Represents a click marker placed on the map at the user's click location. */
export type TypeClickMarker = {
  lonlat: Coordinate;
  symbology?: unknown;
};

/**
 * Displays a marker at the click location when a user clicks on the map.
 *
 * @returns The click marker element
 */
export const ClickMarker = memo(function ClickMarker(): JSX.Element {
  logger.logTraceRender('components/click-marker/click-marker');

  // State
  const clickMarkerRef = useRef<HTMLDivElement>(null);
  const clickMarkerId = `${useGeoViewMapId()}-clickmarker`;

  // Store
  const clickMarker = useMapClickMarker();
  const clickCoordinates = useMapClickCoordinates();
  const { setOverlayClickMarkerRef, showClickMarker } = useMapStoreActions();

  /**
   * Registers the click marker overlay ref on mount.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('CLICK-MARKER - setOverlayClickMarkerRef');

    setOverlayClickMarkerRef(clickMarkerRef.current as HTMLElement);
  }, [setOverlayClickMarkerRef]);

  /**
   * Shows the click marker when click coordinates change.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('CLICK-MARKER - clickCoordinates');

    if (clickCoordinates) {
      showClickMarker({ lonlat: clickCoordinates.lonlat });
    }
  }, [clickCoordinates, showClickMarker]);

  return (
    <Box
      ref={clickMarkerRef}
      id={clickMarkerId}
      sx={{ position: 'absolute', visibility: clickMarker !== undefined ? 'visible' : 'hidden' }}
    >
      <ClickMapMarker
        sx={{
          animation: 'opacity 1s ease-in',
          '@keyframes opacity': {
            from: {
              opacity: 0,
            },
            to: {
              opacity: 1,
            },
          },
        }}
        fontSize="large"
        color="warning"
      />
    </Box>
  );
});
