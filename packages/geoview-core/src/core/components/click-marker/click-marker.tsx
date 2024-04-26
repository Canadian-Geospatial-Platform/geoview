import React, { useEffect, useRef } from 'react';

import { Coordinate } from 'ol/coordinate'; // For typing only

import { Box, ClickMapMarker } from '@/ui';
import { useMapClickMarker, useMapClickCoordinates, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { TypeJsonObject } from '@/core/types/global-types';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

export type TypeClickMarker = {
  lnglat: Coordinate;
  symbology?: TypeJsonObject;
};

/**
 * Create a react element to display a marker ( at the click location) when a user clicks on
 * the map
 *
 * @returns {JSX.Element} the react element with a marker on click
 */
export function ClickMarker(): JSX.Element {
  // Log
  logger.logTraceRender('components/click-marker/click-marker');

  const mapId = useGeoViewMapId();

  // internal state
  const clickMarkerRef = useRef<HTMLDivElement>(null);
  const clickMarkerId = `${mapId}-clickmarker`;

  // get values from the store
  const clickMarker = useMapClickMarker();
  const clickCoordinates = useMapClickCoordinates();
  const { setOverlayClickMarkerRef, showClickMarker } = useMapStoreActions();
  setTimeout(() => setOverlayClickMarkerRef(clickMarkerRef.current as HTMLElement), 0);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('CLICK-MARKER - clickCoordinates');

    if (clickCoordinates) {
      showClickMarker({ lnglat: clickCoordinates.lnglat });
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
}
