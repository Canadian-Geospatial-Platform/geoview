import React, { useEffect, useRef } from 'react';

import { Coordinate } from 'ol/coordinate'; // For typing only

import { useTheme } from '@mui/material';
import { getGeoViewStore } from '@/core/stores/stores-managers';

import { TypeJsonObject, useGeoViewMapId } from '@/app';
import { Box, ClickMapMarker } from '@/ui';

import { useMapClickMarker, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';

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
  const theme = useTheme();

  // internal state
  const markerCoordinates = useRef<Coordinate>();
  const clickMarkerRef = useRef<HTMLDivElement>(null);
  const clickMarkerId = `${mapId}-clickmarker`;

  // get values from the store
  const clickMarker = useMapClickMarker();
  const { setOverlayClickMarkerRef, showClickMarker } = useMapStoreActions();
  setTimeout(() => setOverlayClickMarkerRef(clickMarkerRef.current as HTMLElement), 0);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('CLICK-MARKER - mount');

    // if mapClickCoordinates changed, single click event has been triggered
    const unsubMapSingleClick = getGeoViewStore(mapId).subscribe(
      (state) => state.mapState.clickCoordinates,
      (curClick, prevClick) => {
        // Log
        logger.logTraceCoreStoreSubscription('CLICK-MARKER - clickCoordinates', curClick);

        if (curClick !== prevClick) {
          markerCoordinates.current = curClick!.lnglat;
          showClickMarker({ lnglat: curClick!.lnglat });
        }
      }
    );

    return () => {
      unsubMapSingleClick();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        fontSize={theme.palette.geoViewFontSize.lg}
        color="warning"
      />
    </Box>
  );
}
