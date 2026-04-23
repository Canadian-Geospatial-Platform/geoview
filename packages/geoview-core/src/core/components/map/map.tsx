import { useEffect, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { ProgressBar } from '@/ui';

import { NorthArrow, NorthPoleFlag } from '@/core/components/north-arrow/north-arrow';
import { Crosshair } from '@/core/components/crosshair/crosshair';
import { OverviewMap } from '@/core/components/overview-map/overview-map';
import { ClickMarker } from '@/core/components/click-marker/click-marker';
import { HoverTooltip } from '@/core/components/hover-tooltip/hover-tooltip';

import type { MapViewer } from '@/geo/map/map-viewer';

import { getSxClasses } from './map-style';
import {
  useStoreMapInteraction,
  useStoreMapLoaded,
  useStoreMapNorthArrow,
  useStoreMapOverviewMap,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useStoreLayerAreLayersLoading } from '@/core/stores/store-interface-and-intial-values/layer-state';

/** Props for the Map component. */
type MapProps = {
  /** The map viewer instance. */
  viewer: MapViewer;
};

/** Sx class definitions for the map component (static - no theme dependency). */
const sxClasses = getSxClasses();

/**
 * Creates the map component.
 *
 * @param props - The map component props
 * @returns The map component
 */
export function Map(props: MapProps): JSX.Element {
  // Log
  logger.logTraceRender('components/map/map');

  const { viewer } = props;
  const { t } = useTranslation();

  const defaultTheme = useTheme();

  // internal state - get ref to div element
  const mapElement = useRef<HTMLElement | undefined>();
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md')); // if screen size is medium and up

  // get values from the store
  const mapId = useStoreGeoViewMapId();
  const overviewMap = useStoreMapOverviewMap();
  const northArrow = useStoreMapNorthArrow();
  const mapLoaded = useStoreMapLoaded();
  const mapInteraction = useStoreMapInteraction();
  const layersAreLoading = useStoreLayerAreLayersLoading();

  // flag to check if map is initialized. we added to prevent double rendering in StrictMode
  const hasRun = useRef<boolean>(false);

  /**
   * Initializes the map viewer on mount.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP - viewer');

    // GV Prevent double run, due to React's StrictMode in dev.
    if (!hasRun.current && mapElement.current) {
      hasRun.current = true;

      // Create map
      viewer.createMap(mapElement.current);
    }
  }, [viewer]);

  return (
    // ? the map is focusable and needs to be tabbable for keyboard navigation (only when interaction is dynamic)
    <Box id={`mapTargetElement-${mapId}`} ref={mapElement} sx={sxClasses.mapContainer} tabIndex={mapInteraction === 'static' ? -1 : 0}>
      {mapLoaded && (
        <>
          {northArrow && <NorthArrow />}
          <NorthPoleFlag />
          <Crosshair mapTargetElement={mapElement.current!} />
          <ClickMarker />
          <HoverTooltip />
          {deviceSizeMedUp && overviewMap && viewer.map && <OverviewMap i18n={viewer.getI18nInstance()} />}
        </>
      )}
      {layersAreLoading && (
        <Box sx={{ ...sxClasses.progressBar, bottom: mapInteraction === 'static' ? 0 : 40 }}>
          <ProgressBar aria-label={t('error.map.loadingLayers')!} />
        </Box>
      )}
    </Box>
  );
}
