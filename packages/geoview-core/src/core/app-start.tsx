import { createContext, Suspense, useMemo } from 'react';

import './translation/i18n';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { Shell } from '@/core/containers/shell';
import { getTheme, cgpvTheme } from '@/ui/style/theme';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { api, useAppDisplayLanguageById, useAppDisplayThemeById } from '@/app';
import { logger } from './utils/logger';

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
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
function AppStart(props: AppStartProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-start');

  const { mapFeaturesConfig } = props;
  const { mapId } = mapFeaturesConfig;

  const mapContextValue = useMemo(() => {
    return { mapId: mapId as string };
  }, [mapId]);

  //! get store values by id because context is not set.... it is the only 2 atomic selector by id
  // once context is define, map id is available
  const language = useAppDisplayLanguageById(mapId);
  const theme = useAppDisplayThemeById(mapId);

  /**
   * Create maps from inline configs with class name geoview-map
   */
  function getInlineMaps() {
    const i18nInstance = i18n.cloneInstance({
      lng: language,
      fallbackLng: language,
    });

    //! call layer sets creation here instead of map event processor because the store map event processor
    //! is ot created yet
    api.getFeatureInfoLayerSet(mapId);
    api.getLegendsLayerSet(mapId);

    // create a new map viewer instance and add it to the api
    // TODO: use store, remove the use of feature by viewer class and use state to gather values
    if (!Object.keys(api.maps).includes(mapId)) api.maps[mapId] = new MapViewer(mapFeaturesConfig, i18nInstance);

    // Start the process of checking for map readiness
    api.maps[mapId].mapReady();

    return (
      <I18nextProvider i18n={i18nInstance}>
        <MapContext.Provider value={mapContextValue}>
          <ThemeProvider theme={getTheme(theme)}>
            {/* <StrictMode> */}
            <Shell shellId={mapId as string} />
            {/* </StrictMode> */}
          </ThemeProvider>
        </MapContext.Provider>
      </I18nextProvider>
    );
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={cgpvTheme}>
        <CssBaseline />
        <Suspense fallback="">{getInlineMaps()}</Suspense>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default AppStart;
