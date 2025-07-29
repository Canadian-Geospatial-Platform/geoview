import { useEffect, useRef, memo } from 'react';

import { Coordinate } from 'ol/coordinate'; // For typing only
import { Box, ClickMapMarker } from '@/ui';

import { useMapClickMarker, useMapClickCoordinates, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

export type TypeClickMarker = {
  lonlat: Coordinate;
  symbology?: unknown;
};

/**
 * Create a react element to display a marker ( at the click location) when a user clicks on
 * the map
 *
 * @returns {JSX.Element} the react element with a marker on click
 */
// Memoizes entire component, preventing re-renders if props haven't changed
export const ClickMarker = memo(function ClickMarker(): JSX.Element {
  logger.logTraceRender('components/click-marker/click-marker');

  // State
  const clickMarkerRef = useRef<HTMLDivElement>(null);
  const clickMarkerId = `${useGeoViewMapId()}-clickmarker`;

  // Store
  const clickMarker = useMapClickMarker();
  const clickCoordinates = useMapClickCoordinates();
  const { setOverlayClickMarkerRef, showClickMarker } = useMapStoreActions();

  useEffect(() => {
    setOverlayClickMarkerRef(clickMarkerRef.current as HTMLElement);
  }, [setOverlayClickMarkerRef]);

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
