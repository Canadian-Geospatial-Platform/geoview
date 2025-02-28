import { useEffect, useState } from 'react';

import { createRoot, type Root } from 'react-dom/client';

import { I18nextProvider } from 'react-i18next';

import { ThemeProvider } from '@mui/material/styles';

import { cgpvTheme } from '@/ui/style/theme';
import { OverviewMapToggle } from './overview-map-toggle';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapOverviewMapHideZoom, useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { Box } from '@/ui/layout';
import i18n from '@/core/translation/i18n';

/**
 * Creates an overview map control and adds it to the map
 * @param {OverwiewMapProps} props - Overview map props containing the viewer
 *
 * @returns {JSX.Element} returns empty container
 */
export function OverviewMap(): JSX.Element {
  // Log
  logger.logTraceRender('components/overview-map/overview-map');

  // Store
  const mapId = useGeoViewMapId();
  const zoomLevel = useMapZoom();
  const hideOnZoom = useMapOverviewMapHideZoom();
  const displayLanguage = useAppDisplayLanguage();

  // State
  const [visibility, setVisibility] = useState<boolean>(!(zoomLevel > hideOnZoom));
  const [isInitialized, setIsInitialized] = useState(false);

  // hide on zoom
  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP - zoom level changed');

    // Don't set the visibility until after the component is initialized
    if (!isInitialized) return;

    const shouldBeVisibile = zoomLevel > hideOnZoom;
    if (shouldBeVisibile !== visibility) {
      setVisibility(shouldBeVisibile);
      MapEventProcessor.setOverviewMapVisibility(mapId, shouldBeVisibile);
    }
  }, [mapId, hideOnZoom, zoomLevel, visibility, isInitialized]);

  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP - mount');

    let root: Root | null = null;
    const toggleButton = document.createElement('div');
    const overviewMapControl = MapEventProcessor.getOverviewMapControl(mapId, toggleButton);

    // Use setTimeout to defer root creation to next tick
    const timeoutId = setTimeout(() => {
      root = createRoot(toggleButton);
      root.render(
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={cgpvTheme}>
            <OverviewMapToggle overviewMap={overviewMapControl} />
          </ThemeProvider>
        </I18nextProvider>
      );
      // Store the root reference for cleanup
      MapEventProcessor.setMapOverviewMapRoot(mapId, root);

      // Set initialized to true after everything is set up
      setIsInitialized(true);
    }, 0);

    // Cleanup
    return () => {
      logger.logTraceUseEffectUnmount('OVERVIEW-MAP - unmount');
      clearTimeout(timeoutId);
      setTimeout(() => {
        if (root) {
          root.unmount();
          root = null;
        }
      }, 0);
      setIsInitialized(false);
    };
  }, [mapId, displayLanguage]);

  return <Box />;
}
