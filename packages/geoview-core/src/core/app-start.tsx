import { createContext, StrictMode, Suspense, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { i18n } from 'i18next';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { ScopedCssBaseline } from '@mui/material';
import { Shell } from '@/core/containers/shell';
import { getTheme } from '@/ui/style/theme';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { useAppDisplayThemeById } from '@/core/stores/store-interface-and-intial-values/app-state';
import { api } from '@/app';

logger.logInfo('CREATING CONTEXT');

// create a state that will hold map config information
// TODO: use store, only keep map id on context for store manager to gather right store on hooks
export const MapContext = createContext<TypeMapContext>({
  mapId: '',
  mapFeaturesConfig: undefined,
});

logger.logInfo('CONTEXT CREATED');

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
  i18nLang: i18n;
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
function AppStart(props: AppStartProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-start');

  const { mapFeaturesConfig, i18nLang } = props;
  const { mapId } = mapFeaturesConfig;

  const mapContextValue = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-START - mapContextValue', mapId);

    return { mapId };
  }, [mapId]);

  // GV get store values by id because context is not set.... it is the only atomic selector by id
  // once context is define, map id is available
  const theme = useAppDisplayThemeById(mapId);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={getTheme(theme)}>
        <ScopedCssBaseline>
          <Suspense fallback="">
            <I18nextProvider i18n={i18nLang}>
              <MapContext.Provider value={mapContextValue}>
                <StrictMode>
                  <Shell mapViewer={api.getMapViewer(mapId)} />
                </StrictMode>
              </MapContext.Provider>
            </I18nextProvider>
          </Suspense>
        </ScopedCssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default AppStart;
