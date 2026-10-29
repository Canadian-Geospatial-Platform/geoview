import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import type { i18n } from 'i18next';
import type { OverviewMap as OLOverviewMap } from 'ol/control';

import { Box } from '@/ui/layout';
import { OverviewMapToggle } from './overview-map-toggle';
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
  const mapController = useMapController();

  // State
  const [overviewMapControl, setOverviewMapControl] = useState<OLOverviewMap>();

  // Values
  const shouldBeVisible = overviewMapControl !== undefined && overviewShouldBeVisible;

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
    setOverviewMapControl(mapController.initOverviewMapControl(toggleButton));

    // Cleanup
    return () => {
      logger.logTraceUseEffectUnmount('OVERVIEW-MAP - unmount');
      // Hide the overview map control when component unmounts
      mapController.setOverviewMapVisibility(false);
      setOverviewMapControl(undefined);
    };
  }, [mapController]);

  // OverviewMapToggle creates its portal inside the OpenLayers button while retaining
  // this map's ThemeProvider context; no separate provider is needed.

  // TODO: Review the obsolete separate-root tracking: MapController.setMapOverviewMapRoot,
  // MapViewer.overviewRoot and its unmount path. Check downstream compatibility before removal.
  return (
    <Box>
      {overviewMapControl && (
        <I18nextProvider i18n={i18n}>
          <OverviewMapToggle overviewMap={overviewMapControl} />
        </I18nextProvider>
      )}
    </Box>
  );
}
