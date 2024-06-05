import { createContext, Suspense, useMemo } from 'react';

import './translation/i18n';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { ScopedCssBaseline } from '@mui/material';
import { Shell } from '@/core/containers/shell';
import { getTheme, cgpvTheme } from '@/ui/style/theme';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { api } from '@/app';
import { logger } from './utils/logger';
import { useAppDisplayLanguageById, useAppDisplayThemeById } from './stores/store-interface-and-intial-values/app-state';

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
  // eslint-disable-next-line react/require-default-props
  onMapViewerInit?: (mapViewer: MapViewer) => void;
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
function AppStart(props: AppStartProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-start');

  const { mapFeaturesConfig, onMapViewerInit } = props;
  const { mapId } = mapFeaturesConfig;

  const mapContextValue = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-START - mapContextValue', mapId);

    return { mapId };
  }, [mapId]);

  // GV get store values by id because context is not set.... it is the only 2 atomic selector by id
  // once context is define, map id is available
  const language = useAppDisplayLanguageById(mapId);
  const theme = useAppDisplayThemeById(mapId);

  /**
   * Create maps from inline configs with class name geoview-map
   * returns {JSX.Element}
   */
  function getInlineMaps(): JSX.Element {
    const i18nInstance = i18n.cloneInstance({
      lng: language,
      fallbackLng: language,
    });

    // create a new map viewer instance and add it to the api
    // TODO: use store, remove the use of feature by viewer class and use state to gather values
    if (!(mapId in api.maps)) {
      const mapViewer = new MapViewer(mapFeaturesConfig, i18nInstance);
      api.maps[mapId] = mapViewer;
    }

    // Register a handler (which will only happen once) for when the map viewer will get initialized.
    // At the time of writing, this happens later, asynchronously, via the components/map/map.tsx when 'MapViewer.initMap()' is called.
    // That should be fixed eventually, but that refactoring is out of the scope at the time of writing. So, I'm doing like this for now.
    api.maps[mapId].onMapInit((mapViewer) => {
      // MapViewer has been created and initialized, callback about it
      onMapViewerInit?.(mapViewer);
    });

    // TODO: Refactor #1810 - Activate <React.StrictMode> here or in app.tsx?
    return (
      <I18nextProvider i18n={i18nInstance}>
        <MapContext.Provider value={mapContextValue}>
          <ThemeProvider theme={getTheme(theme)}>
            {/* <StrictMode> */}
            <Shell mapViewer={api.maps[mapId]} />
            {/* </StrictMode> */}
          </ThemeProvider>
        </MapContext.Provider>
      </I18nextProvider>
    );
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={cgpvTheme}>
        <ScopedCssBaseline>
          <Suspense fallback="">{getInlineMaps()}</Suspense>
        </ScopedCssBaseline>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default AppStart;
