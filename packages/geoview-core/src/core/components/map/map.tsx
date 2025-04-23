/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useCallback, MutableRefObject, useMemo } from 'react';
import './tempbutt.css';

import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import * as Cesium from 'cesium';
import { NorthArrow, NorthPoleFlag } from '@/core/components/north-arrow/north-arrow';
import { Crosshair } from '@/core/components/crosshair/crosshair';
import { OverviewMap } from '@/core/components/overview-map/overview-map';
import { ClickMarker } from '@/core/components/click-marker/click-marker';
import { HoverTooltip } from '@/core/components/hover-tooltip/hover-tooltip';

import { MapViewer } from '@/geo/map/map-viewer';

import { getSxClasses } from './map-style';
import { useMapLoaded, useMapNorthArrow, useMapOverviewMap } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { Plugin } from '@/api/plugin/plugin';
import { logger } from '@/core/utils/logger';
import { toJsonObject } from '@/core/types/global-types';

type MapProps = {
  viewer: MapViewer;
};
Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2OWJhMWNjZS03NmNjLTQ0OGItOGE5MC02MzVmNjVjZjBlM2UiLCJpZCI6MTEwMDMwLCJpYXQiOjE2NjQ4NzQwNDB9.3spD2Vvdc267VZFFQozH0nxmeJRlE7dQC5QsKeiJMiY';
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
  const mapStoreConfig = useGeoViewConfig();
  // flag to check if map is initialized. we added to prevent double rendering in StrictMode
  const isMapInitialized = useRef<boolean>(false);

  const initCGPVMap = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('map.initCGPVMap');
    // Load the core packages which are the ones who load on map (not footer plugin, not app-bar plugin)
    mapStoreConfig?.corePackages?.forEach((corePackage: string): void => {
      Plugin.loadScript(corePackage)
        .then((constructor) => {
          // add the plugin by passing in the loaded constructor from the script tag
          Plugin.addPlugin(
            corePackage,
            mapId,
            constructor,
            toJsonObject({
              mapId,
              viewer,
            })
          ).catch((error) => {
            // Log
            logger.logPromiseFailed('api.plugin.addPlugin in useCallback in map', error);
          });
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('api.plugin.addPlugin in useCallback in map', error);
        });
    });
  }, [mapId, mapStoreConfig?.corePackages, viewer]);

  useEffect((): void => {
    // Log
    logger.logTraceUseEffect('map.initMap');

    // check if map is initialized and if not, initialize it
    if (!isMapInitialized.current) {
      // Init the map on first render
      viewer.createMap(mapElement.current!);
      initCGPVMap();
      isMapInitialized.current = true;
    } else {
      // alert('Map already initialized');
      // viewer.cmap.setEnabled(true);
    }
  }, [initCGPVMap, viewer]);

  // useEffect((): void => {
  //   // Log
  //   logger.logTraceUseEffect('map.init3dMap');
  //   if (isMapInitialized.current) {
  //     //const initMap = viewer.map;
  //     //let cmap = new OLCesium({ map: initMap });
  //     // cmap.setEnabled(true);
  //   }
  // }, [viewer]);
  return (
    // ? the map is focusable and needs to be tabbable for keyboard navigation
    /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
    <>
      <Box id={`mapTargetElement-${mapId}`} ref={mapElement as MutableRefObject<HTMLDivElement>} sx={sxClasses.mapContainer} tabIndex={0}>
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
      </Box>
      {/* <div */}
      {/*   ref={cesiumElement as MutableRefObject<HTMLDivElement>} */}
      {/*   className="tempbutt" */}
      {/*   // onClick={() => { */}
      {/*   //   viewer.cmap.setEnabled(true); */}
      {/*   //   console.log(viewer.cmap.getDataSources()); */}
      {/*   // }} */}
      {/* /> */}
    </>
  );
}
