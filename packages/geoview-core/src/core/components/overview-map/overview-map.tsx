import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import type { i18n } from 'i18next';

import { ThemeProvider } from '@mui/material/styles';

import { cgpvTheme } from '@/ui/style/theme';
import { OverviewMapToggle } from './overview-map-toggle';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapOverviewMapHideZoom, useMapZoom } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { Box } from '@/ui/layout';
import { TIMEOUT } from '@/core/utils/constant';
import { useMapController } from '@/core/controllers/map-controller';

/** The properties for the overview map component. */
export type OverviewMapProps = {
  /** The i18next instance for translations. */
  i18n: i18n;
};

/**
 * Creates an overview map control and adds it to the map.
 *
 * @param props - The overview map properties
 * @returns The overview map container element
 */
export function OverviewMap(props: OverviewMapProps): JSX.Element {
  // Log
  logger.logTraceRender('components/overview-map/overview-map');

  // Store
  const zoomLevel = useMapZoom();
  const hideOnZoom = useMapOverviewMapHideZoom();
  const displayLanguage = useAppDisplayLanguage();
  const { i18n } = props;
  const mapController = useMapController();

  // State
  const [visibility, setVisibility] = useState<boolean>(!(zoomLevel > hideOnZoom));
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Updates visibility based on zoom level changes.
   */
  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP - zoom level changed');

    // Don't set the visibility until after the component is initialized
    if (!isInitialized) return;

    const shouldBeVisibile = zoomLevel > hideOnZoom;
    if (shouldBeVisibile !== visibility) {
      setVisibility(shouldBeVisibile);
      mapController.setOverviewMapVisibility(shouldBeVisibile);
    }
  }, [mapController, hideOnZoom, zoomLevel, visibility, isInitialized]);

  /**
   * Initializes the overview map control and renders the toggle button on mount.
   */
  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP - mount');

    let root: Root | null = null;
    const toggleButton = document.createElement('div');
    const overviewMapControl = mapController.initOverviewMapControl(toggleButton);

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
      mapController.setMapOverviewMapRoot(root);

      // Set initialized to true after everything is set up
      setIsInitialized(true);
    }, TIMEOUT.deferExecution);

    // Cleanup
    return () => {
      logger.logTraceUseEffectUnmount('OVERVIEW-MAP - unmount');
      clearTimeout(timeoutId);
      setTimeout(() => {
        if (root) {
          root.unmount();
          root = null;
        }
      }, TIMEOUT.deferExecution);
      setIsInitialized(false);
    };
  }, [mapController, displayLanguage, i18n]);

  return <Box />;
}
