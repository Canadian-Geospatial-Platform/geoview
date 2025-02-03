import { useEffect } from 'react';

import { createRoot, type Root } from 'react-dom/client';

import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider } from '@mui/material/styles';

import { cgpvTheme } from '@/ui/style/theme';
import { OverviewMapToggle } from './overview-map-toggle';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { logger } from '@/core/utils/logger';
import { Box } from '@/ui/layout';

/**
 * Creates an overview map control and adds it to the map
 * @param {OverwiewMapProps} props - Overview map props containing the viewer
 *
 * @returns {JSX.Element} returns empty container
 */
export function OverviewMap(): JSX.Element {
  // Log
  logger.logTraceRender('components/overview-map/overview-map');
  const mapId = useGeoViewMapId();
  const displayLanguage = useAppDisplayLanguage();

  useEffect(() => {
    let root: Root | null = null;
    const toggleButton = document.createElement('div');
    const overviewMapControl = MapEventProcessor.createOverviewMapBasemap(mapId, toggleButton);

    const i18nInstance = i18n.cloneInstance({
      lng: displayLanguage,
      fallbackLng: displayLanguage,
    });

    // Use setTimeout to defer root creation to next tick
    const timeoutId = setTimeout(() => {
      root = createRoot(toggleButton);
      root.render(
        <I18nextProvider i18n={i18nInstance}>
          <ThemeProvider theme={cgpvTheme}>
            <OverviewMapToggle overviewMap={overviewMapControl} />
          </ThemeProvider>
        </I18nextProvider>
      );
      // Store the root reference for cleanup
      MapEventProcessor.setMapOverviewMapRoot(mapId, root);
    }, 0);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      setTimeout(() => {
        if (root) {
          root.unmount();
          root = null;
        }
      }, 0);
    };
  }, [mapId, displayLanguage]);

  return <Box />;
}
