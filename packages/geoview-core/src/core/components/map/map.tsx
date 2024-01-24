import { useEffect, useRef, useCallback, MutableRefObject } from 'react';

import OLMap from 'ol/Map';
import View from 'ol/View';
import { Extent } from 'ol/extent';

import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { NorthArrow, NorthPoleFlag } from '@/core/components/north-arrow/north-arrow';
import { Crosshair } from '@/core/components/crosshair/crosshair';
import { OverviewMap } from '@/core/components/overview-map/overview-map';
import { ClickMarker } from '@/core/components/click-marker/click-marker';
import { HoverTooltip } from '@/core/components/hover-tooltip/hover-tooltip';

import { MapViewer } from '@/geo/map/map-viewer';

import { sxClasses } from './map-style';
import {
  useMapLoaded,
  useMapNorthArrow,
  useMapOverviewMap,
  useMapProjection,
  useMapStoreActions,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { api, toJsonObject } from '@/app';
import { logger } from '@/core/utils/logger';

export function Map(): JSX.Element {
  // Log
  logger.logTraceRender('components/map/map');

  const defaultTheme = useTheme();

  // internal state - get ref to div element
  const mapElement = useRef<HTMLDivElement | undefined>();
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md')); // if screen size is medium and up

  // get values from the store
  const mapId = useGeoViewMapId();
  const overviewMap = useMapOverviewMap();
  const northArrow = useMapNorthArrow();
  const mapLoaded = useMapLoaded();
  const mapStoreConfig = useGeoViewConfig();
  const projectionCode = useMapProjection();
  const { createEmptyBasemap, createBaseMapFromOptions } = useMapStoreActions();

  // create a new map viewer instance
  // TODO: use store
  const viewer: MapViewer = api.maps[mapId];

  const initCGPVMap = useCallback(
    (cgpvMap: OLMap) => {
      // Log
      logger.logTraceUseCallback('map.initCGPVMap');

      cgpvMap.set('mapId', mapId);

      // initialize the map viewer and load plugins
      viewer.initMap(cgpvMap);

      // load basemap from selected options
      createBaseMapFromOptions();

      // Load the core packages which are the ones who load on map (not footer plugin, not app-bar plugin)
      mapStoreConfig?.corePackages?.forEach((corePackage: string) => {
        api.plugin.loadScript(corePackage).then((constructor) => {
          // add the plugin by passing in the loaded constructor from the script tag
          api.plugin.addPlugin(
            corePackage,
            mapId,
            constructor,
            toJsonObject({
              mapId,
            })
          );
        });
      });
    },
    [createBaseMapFromOptions, mapId, mapStoreConfig?.corePackages, viewer]
  );

  const initMap = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('map.initMap');

    // create map projection object from code
    const projection = api.projection.projections[projectionCode];

    let extentProjected: Extent | undefined;
    if (mapStoreConfig?.map.viewSettings.extent)
      extentProjected = api.projection.transformExtent(mapStoreConfig?.map.viewSettings.extent, 'EPSG:4326', projection.getCode());

    const initialMap = new OLMap({
      target: mapElement.current as string | HTMLElement | undefined,
      layers: [createEmptyBasemap()],
      view: new View({
        projection,
        center: api.projection.transformFromLonLat(
          [mapStoreConfig?.map.viewSettings.center[0] || -105, mapStoreConfig?.map.viewSettings.center[1] || 60],
          projection
        ),
        zoom: mapStoreConfig?.map.viewSettings.zoom,
        extent: extentProjected || undefined,
        minZoom: mapStoreConfig?.map.viewSettings.minZoom || 0,
        maxZoom: mapStoreConfig?.map.viewSettings.maxZoom || 17,
      }),
      controls: [],
      keyboardEventTarget: document.getElementById(`map-${mapId}`) as HTMLElement,
    });

    initCGPVMap(initialMap);
  }, [
    createEmptyBasemap,
    initCGPVMap,
    mapId,
    mapStoreConfig?.map.viewSettings.center,
    mapStoreConfig?.map.viewSettings.extent,
    mapStoreConfig?.map.viewSettings.maxZoom,
    mapStoreConfig?.map.viewSettings.minZoom,
    mapStoreConfig?.map.viewSettings.zoom,
    projectionCode,
  ]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('map.initMap');

    // Init the map on first render
    initMap();
  }, [initMap]);

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
    <Box id={`mapbox-${mapId}`} ref={mapElement as MutableRefObject<HTMLDivElement>} sx={sxClasses.mapContainer} tabIndex={0}>
      {mapLoaded && (
        <>
          {northArrow && <NorthArrow />}
          <NorthPoleFlag />
          <Crosshair />
          <ClickMarker />
          <HoverTooltip />
          {deviceSizeMedUp && overviewMap && <OverviewMap />}
        </>
      )}
    </Box>
  );
}
