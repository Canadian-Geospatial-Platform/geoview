/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useRef, MutableRefObject } from 'react';

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
import { api } from '@/app';

export function Map(): JSX.Element {
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

  const initCGPVMap = (cgpvMap: OLMap) => {
    cgpvMap.set('mapId', mapId);

    // initialize the map viewer and load plugins
    viewer.initMap(cgpvMap);

    // load basemap from selected options
    createBaseMapFromOptions();

    // call the ready function since rendering of this map instance is done
    api.ready(() => {
      // load plugins once all maps have rendered
      api.plugin.loadPlugins();
    });
  };

  const initMap = (): void => {
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
  };

  useEffect(() => {
    initMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
    <Box id={`map-${mapId}`} ref={mapElement as MutableRefObject<HTMLDivElement>} sx={sxClasses.mapContainer} tabIndex={0}>
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
