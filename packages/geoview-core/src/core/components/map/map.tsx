import { useEffect, useRef, useMemo } from 'react';

import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { ProgressBar } from '@/ui';

import { NorthArrow, NorthPoleFlag } from '@/core/components/north-arrow/north-arrow';
import { Crosshair } from '@/core/components/crosshair/crosshair';
import { OverviewMap } from '@/core/components/overview-map/overview-map';
import { ClickMarker } from '@/core/components/click-marker/click-marker';
import { HoverTooltip } from '@/core/components/hover-tooltip/hover-tooltip';

import { MapViewer } from '@/geo/map/map-viewer';

import { getSxClasses } from './map-style';
import {
  useMapLoaded,
  useMapNorthArrow,
  useMapOverviewMap,
  useMapStoreActions,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useAppCrosshairsActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useLayersAreLoading } from '@/core/stores/store-interface-and-intial-values/layer-state';

type MapProps = {
  viewer: MapViewer;
};

/**
 * Create a map component
 * @param {MapProps} props - Map props containing the viewer
 *
 * @return {JSX.Element} The map component
 */
export function Map(props: MapProps): JSX.Element {
  // Log
  logger.logTraceRender('components/map/map');

  const { viewer } = props;

  const defaultTheme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(), []);

  // internal state - get ref to div element
  const mapElement = useRef<HTMLElement | undefined>();
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md')); // if screen size is medium and up

  // get values from the store
  const mapId = useGeoViewMapId();
  const overviewMap = useMapOverviewMap();
  const northArrow = useMapNorthArrow();
  const mapLoaded = useMapLoaded();
  const layersAreLoading = useLayersAreLoading();
  const isCrosshairsActive = useAppCrosshairsActive();
  const { setActiveMapInteractionWCAG } = useMapStoreActions();

  // flag to check if map is initialized. we added to prevent double rendering in StrictMode
  const hasRun = useRef<boolean>(false);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP - viewer');

    // FIXME: Here, we're preventing a double run, because at this level it's not only impacting a rendering thing, it's impacting the core
    // FIX.MECONT: and raising double mapReady events which doesn't make sense.
    // FIX.MECONT: The core of the issue is that the map creation shouldn't be happening inside a 'useEffect' hook, which is a UI thing.
    // Prevent double run, due to React's StrictMode in dev.
    if (!hasRun.current && mapElement.current) {
      hasRun.current = true;

      // Create map
      viewer.createMap(mapElement.current);
    }
  }, [viewer]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP - Enable WCAG map interactions', isCrosshairsActive);

    setActiveMapInteractionWCAG(isCrosshairsActive);
  }, [isCrosshairsActive, setActiveMapInteractionWCAG]);

  return (
    // ? the map is focusable and needs to be tabbable for keyboard navigation
    <Box id={`mapTargetElement-${mapId}`} ref={mapElement} sx={sxClasses.mapContainer} tabIndex={0}>
      {mapLoaded && (
        <>
          {northArrow && <NorthArrow />}
          <NorthPoleFlag />
          <Crosshair mapTargetElement={mapElement.current!} />
          <ClickMarker />
          <HoverTooltip />
          {deviceSizeMedUp && overviewMap && viewer.map && <OverviewMap />}
        </>
      )}
      {layersAreLoading && (
        <Box sx={sxClasses.progressBar}>
          <ProgressBar />
        </Box>
      )}
    </Box>
  );
}
