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
import { MapStatusIndicators } from '@/core/components/map/status-indicator/status-indicator';

import type { MapViewer } from '@/geo/map/map-viewer';

import { getSxClasses } from './map-style';
import { useStoreMapInteraction, useStoreMapLoaded, useStoreMapNorthArrow, useStoreMapOverviewMap } from '@/core/stores/states/map-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { useStoreLayerAreLayersLoading } from '@/core/stores/states/layer-state';
import { getStoreAppIsCrosshairsActive, useStoreAppGeoviewHTMLElement } from '@/core/stores/states/app-state';
import { useUIController } from '@/core/controllers/use-controllers';

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
  const mapElement = useRef<HTMLElement>(null);
  const deviceSizeMedUp = useMediaQuery(defaultTheme.breakpoints.up('md')); // if screen size is medium and up

  // get values from the store
  const mapId = useStoreGeoViewMapId();
  const overviewMap = useStoreMapOverviewMap();
  const northArrow = useStoreMapNorthArrow();
  const mapLoaded = useStoreMapLoaded();
  const mapInteraction = useStoreMapInteraction();
  const layersAreLoading = useStoreLayerAreLayersLoading();
  const geoviewHTMLElement = useStoreAppGeoviewHTMLElement();

  const uiController = useUIController();

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
    <Box id={`mapTargetElement-${mapId}`} ref={mapElement} sx={sxClasses.mapContainer} tabIndex={mapInteraction === 'static' ? -1 : 0}>
      {mapLoaded && (
        <>
          {northArrow && <NorthArrow />}
          <NorthPoleFlag />
          <Crosshair mapTargetElement={mapElement.current!} />
          <MapStatusIndicators />
          <ClickMarker />
          <HoverTooltip />
          {deviceSizeMedUp && overviewMap && viewer.map && <OverviewMap i18n={viewer.getI18nInstance()} />}
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
