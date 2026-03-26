import { useEffect, useRef, memo } from 'react';

import type { Coordinate } from 'ol/coordinate';
import { Box, ClickMapMarker } from '@/ui';

import {
  useMapClickMarker,
  useMapClickCoordinates,
  setStoreMapOverlayClickMarkerRef,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

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
  const mapId = useGeoViewMapId();
  const clickMarkerRef = useRef<HTMLDivElement>(null);
  const clickMarkerId = `${mapId}-clickmarker`;

  // Store
  const clickMarker = useMapClickMarker();
  const clickCoordinates = useMapClickCoordinates();

  useEffect(() => {
    // Update the store
    setStoreMapOverlayClickMarkerRef(mapId, clickMarkerRef.current as HTMLElement);
  }, [mapId]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('CLICK-MARKER - clickCoordinates');

    if (clickCoordinates) {
      MapEventProcessor.clickMarkerIconShow(mapId, { lonlat: clickCoordinates.lonlat });
    }
  }, [clickCoordinates, mapId]);

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
