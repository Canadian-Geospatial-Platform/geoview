import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import type { i18n } from 'i18next';

import { ThemeProvider } from '@mui/material/styles';

import { Box } from '@/ui/layout';
import { cgpvTheme } from '@/ui/style/theme';
import { OverviewMapToggle } from './overview-map-toggle';
import { useStoreAppDisplayLanguage } from '@/core/stores/states/app-state';
import { useStoreMapOverviewShouldBeVisible } from '@/core/stores/states/map-state';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/use-controllers';

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

  // Props
  const { i18n } = props;

  // Store
  const overviewShouldBeVisible = useStoreMapOverviewShouldBeVisible();
  const displayLanguage = useStoreAppDisplayLanguage();
  const mapController = useMapController();

  // State
  const [isInitialized, setIsInitialized] = useState(false);

  // Values
  const shouldBeVisible = isInitialized && overviewShouldBeVisible;

  /**
   * Updates visibility based on zoom level changes.
   */
  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP - shouldBeVisible', shouldBeVisible);

    // Tweak the visibility
    mapController.setOverviewMapVisibility(shouldBeVisible);
  }, [mapController, shouldBeVisible]);

  /**
   * Initializes the overview map control and renders the toggle button on mount.
   */
  useEffect(() => {
    logger.logTraceUseEffect('OVERVIEW-MAP - mount');

    const toggleButton = document.createElement('div');
    const overviewMapControl = mapController.initOverviewMapControl(toggleButton);

    const root = createRoot(toggleButton);
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

    // Cleanup
    return () => {
      logger.logTraceUseEffectUnmount('OVERVIEW-MAP - unmount');
      // Hide the overview map control when component unmounts
      mapController.setOverviewMapVisibility(false);
      setIsInitialized(false);
      // Defer unmount to avoid "synchronously unmount a root while React was already rendering" error. A setTimeout with 0 ms is the standard workaround for this.
      setTimeout(() => root.unmount(), 0);
    };
  }, [mapController, displayLanguage, i18n]);

  return <Box />;
}
