import { useEffect, useRef, useCallback, MutableRefObject } from 'react';

import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { NorthArrow, NorthPoleFlag } from '@/core/components/north-arrow/north-arrow';
import { Crosshair } from '@/core/components/crosshair/crosshair';
import { OverviewMap } from '@/core/components/overview-map/overview-map';
import { ClickMarker } from '@/core/components/click-marker/click-marker';
import { HoverTooltip } from '@/core/components/hover-tooltip/hover-tooltip';

import { MapViewer } from '@/geo/map/map-viewer';

import { sxClasses } from './map-style';
import { useMapLoaded, useMapNorthArrow, useMapOverviewMap } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { api } from '@/app';
import { logger } from '@/core/utils/logger';
import { toJsonObject } from '@/core/types/global-types';

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

  // internal state - get ref to div element
  const mapElement = useRef<HTMLElement | undefined>();
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md')); // if screen size is medium and up

  // get values from the store
  const mapId = useGeoViewMapId();
  const overviewMap = useMapOverviewMap();
  const northArrow = useMapNorthArrow();
  const mapLoaded = useMapLoaded();
  const mapStoreConfig = useGeoViewConfig();

  const initCGPVMap = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('map.initCGPVMap');

    // Load the core packages which are the ones who load on map (not footer plugin, not app-bar plugin)
    mapStoreConfig?.corePackages?.forEach((corePackage: string): void => {
      api.plugin
        .loadScript(corePackage)
        .then((constructor) => {
          // add the plugin by passing in the loaded constructor from the script tag
          api.plugin
            .addPlugin(
              corePackage,
              mapId,
              constructor,
              toJsonObject({
                mapId,
              })
            )
            .catch((error) => {
              // Log
              logger.logPromiseFailed('api.plugin.addPlugin in useCallback in map', error);
            });
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('api.plugin.addPlugin in useCallback in map', error);
        });
    });
  }, [mapId, mapStoreConfig?.corePackages]);

  useEffect((): void => {
    // Log
    logger.logTraceUseEffect('map.initMap');

    // Init the map on first render
    viewer.createMap(mapElement.current!);

    initCGPVMap();
  }, [initCGPVMap, viewer]);

  return (
    // ? the map is focusable and needs to be tabbable for keyboard navigation
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
    <Box id={`mapTargetElement-${mapId}`} ref={mapElement as MutableRefObject<HTMLDivElement>} sx={sxClasses.mapContainer} tabIndex={0}>
      {mapLoaded && (
        <>
          {northArrow && <NorthArrow />}
          <NorthPoleFlag />
          <Crosshair mapTargetElement={mapElement.current!} />
          <ClickMarker />
          <HoverTooltip />
          {deviceSizeMedUp && overviewMap && viewer.map && <OverviewMap olMap={viewer.map} />}
        </>
      )}
    </Box>
  );
}
