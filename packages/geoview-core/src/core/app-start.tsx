import { createContext, StrictMode, Suspense, useMemo, useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { ScopedCssBaseline } from '@mui/material';
import { Shell } from '@/core/containers/shell';
import { getTheme, cgpvTheme } from '@/ui/style/theme';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { api } from '@/app';
import { createI18nInstance } from '@/core/translation/i18n';
import { useAppDisplayThemeById } from '@/core/stores/store-interface-and-intial-values/app-state';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { GeoViewMapIdAlreadyExistError } from '@/core/exceptions/geoview-exceptions';

// create a state that will hold map config information
// TODO: use store, only keep map id on context for store manager to gather right store on hooks
export const MapContext = createContext<TypeMapContext>({
  mapId: '',
  mapFeaturesConfig: undefined,
});

/**
 * Type used for the map context
 */
export type TypeMapContext = {
  mapId: string;
  mapFeaturesConfig?: TypeMapFeaturesConfig;
};

/**
 * interface used when passing map features configuration
 */
interface AppStartProps {
  mapFeaturesConfig: TypeMapFeaturesConfig;
  lang: TypeDisplayLanguage;
  onMapViewerInit?: (mapViewer: MapViewer) => void;
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
function AppStart(props: AppStartProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-start');

  const { mapFeaturesConfig, lang, onMapViewerInit } = props;
  const { mapId } = mapFeaturesConfig;
  const [content, setContent] = useState<JSX.Element | null>(null);

  const mapContextValue = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-START - mapContextValue', mapId);

    return { mapId };
  }, [mapId]);

  // GV get store values by id because context is not set.... it is the only atomic selector by id
  // once context is define, map id is available
  const theme = useAppDisplayThemeById(mapId);

  useEffect(() => {
    logger.logTraceUseEffect('APP-START - initializeMap', mapId);

    async function initializeMap(): Promise<void> {
      // If a map with this id already exist, throw error
      if (api.hasMapViewer(mapId)) throw new GeoViewMapIdAlreadyExistError(mapId);

      // Create i18n istance for the map
      const i18n = await createI18nInstance(lang);

      // create a new map viewer instance and add it to the api
      // TODO: use store, remove the use of feature by viewer class and use state to gather values
      const mapViewer = new MapViewer(mapFeaturesConfig, i18n);
      api.setMapViewer(mapId, mapViewer, onMapViewerInit);

      setContent(
        <I18nextProvider i18n={i18n}>
          <MapContext.Provider value={mapContextValue}>
            <ThemeProvider theme={getTheme(theme)}>
              <StrictMode>
                <Shell mapViewer={api.getMapViewer(mapId)} />
              </StrictMode>
            </ThemeProvider>
          </MapContext.Provider>
        </I18nextProvider>
      );
    }

    initializeMap().catch((error) => logger.logPromiseFailed('Error initializing map', error));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]); // Only re-run if mapId changes

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={cgpvTheme}>
        <ScopedCssBaseline>
          <Suspense fallback="">{content}</Suspense>
        </ScopedCssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default AppStart;
