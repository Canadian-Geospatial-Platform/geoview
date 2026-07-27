import { useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Box, ProgressBar } from '@/ui';
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
  getStoreMapOverviewMapVisible,
} from '@/core/stores/states/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { OVERVIEW_MAP_MIN_CONTAINER_WIDTH, OVERVIEW_MAP_MIN_CONTAINER_HEIGHT } from '@/core/utils/constant';
import { useStoreLayerAreLayersLoading } from '@/core/stores/states/layer-state';
import { getStoreAppIsCrosshairsActive, useStoreAppGeoviewHTMLElement } from '@/core/stores/states/app-state';
import { useUIController, useMapController } from '@/core/controllers/use-controllers';

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

  // internal state - get ref to div element
  const mapElement = useRef<HTMLElement>(null);
  const [mapContainerDimensions, setMapContainerDimensions] = useState({ width: 0, height: 0 });

  // get values from the store
  const mapId = useStoreGeoViewMapId();
  const overviewMap = useStoreMapOverviewMap();
  const northArrow = useStoreMapNorthArrow();
  const mapLoaded = useStoreMapLoaded();
  const mapInteraction = useStoreMapInteraction();
  const layersAreLoading = useStoreLayerAreLayersLoading();
  const geoviewHTMLElement = useStoreAppGeoviewHTMLElement();

  const uiController = useUIController();
  const mapController = useMapController();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Tracks map container dimensions for overview map visibility control.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP - ResizeObserver for overview map visibility', mapElement);

    if (!mapElement.current) return undefined;

    const resizeObserver = new ResizeObserver((entries) => {
      // Use entries[0] to get the observed element's dimensions
      // This is more reliable than accessing mapElement.current in the callback
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setMapContainerDimensions({
          width,
          height,
        });
      }
    });

    resizeObserver.observe(mapElement.current);

    // Capture initial dimensions immediately (ResizeObserver only fires on actual resize, not on initial observe)
    setMapContainerDimensions({
      width: mapElement.current.clientWidth,
      height: mapElement.current.clientHeight,
    });

    return (): void => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Syncs overview map visibility to store based on container dimensions and config.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP - Overview map visibility sync', mapContainerDimensions, overviewMap);

    // Calculate whether overview map SHOULD be visible based on:
    // 1. Config has 'overview-map' enabled
    // 2. Container meets minimum size requirements
    const shouldBeVisible =
      overviewMap &&
      mapContainerDimensions.width >= OVERVIEW_MAP_MIN_CONTAINER_WIDTH &&
      mapContainerDimensions.height >= OVERVIEW_MAP_MIN_CONTAINER_HEIGHT;

    // Only update if visibility state actually changed (prevents redundant store writes and re-renders)
    const currentVisibility = getStoreMapOverviewMapVisible(mapId);
    if (currentVisibility !== shouldBeVisible) {
      mapController.setOverviewMapVisibility(shouldBeVisible);
    }
  }, [mapContainerDimensions, overviewMap, mapController, mapId]);

  /**
   * Global keyboard shortcut to activate crosshair and focus map.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('MAP - Crosshair shortcut listener');

    const handleGlobalShortcut = (event: KeyboardEvent): void => {
      // Ctrl+M (or Cmd+M on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'm' && !event.shiftKey) {
        // Only activate if map interaction is not static
        if (mapInteraction !== 'static' && mapElement.current) {
          // Check if the currently focused element is within the GeoView app
          const { activeElement } = document;

          // Only respond if focus is within this specific map instance
          if (!activeElement || !geoviewHTMLElement?.contains(activeElement)) {
            return; // Focus is not in this map - let another map instance handle it
          }

          event.preventDefault();

          // Focus the map element (this will trigger crosshair activation)
          mapElement.current.focus();

          // Explicitly toggle crosshair on if it's not already active
          // (focus alone should activate it, but this ensures it's on)
          if (!getStoreAppIsCrosshairsActive(mapId)) {
            uiController.setCrosshairActive(true);
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalShortcut);

    return (): void => {
      document.removeEventListener('keydown', handleGlobalShortcut);
    };
  }, [mapInteraction, mapId, uiController, geoviewHTMLElement]);

  return (
    // ? the map is focusable and needs to be tabbable for keyboard navigation (only when interaction is dynamic)
    <Box
      id={`mapTargetElement-${mapId}`}
      ref={mapElement}
      sx={sxClasses.mapContainer}
      tabIndex={mapInteraction === 'static' ? -1 : 0}
      role="region"
      aria-label={t('map.container', { mapId })}
    >
      {mapLoaded && (
        <>
          {northArrow && <NorthArrow />}
          <NorthPoleFlag />
          <Crosshair mapTargetElement={mapElement.current!} />
          <ClickMarker />
          <HoverTooltip />
          {mapContainerDimensions.width >= OVERVIEW_MAP_MIN_CONTAINER_WIDTH &&
            mapContainerDimensions.height >= OVERVIEW_MAP_MIN_CONTAINER_HEIGHT &&
            overviewMap &&
            viewer.map && <OverviewMap i18n={viewer.getI18nInstance()} />}
        </>
      )}
      {layersAreLoading && (
        <Box sx={{ ...sxClasses.progressBar, bottom: mapInteraction === 'static' ? 0 : 40 }}>
          <ProgressBar aria-label={t('error.map.loadingLayers')} />
        </Box>
      )}
    </Box>
  );
}
