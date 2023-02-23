import React, { Suspense, useMemo } from 'react';

import './translation/i18n';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { Shell } from './containers/shell';
import { getTheme, cgpvTheme } from '../ui/style/theme';
import { MapViewer } from '../geo/map/map';
import { TypeMapFeaturesConfig } from './types/global-types';
import { TypeInteraction } from '../app';

declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

// create a state that will hold map config information
export const MapContext = React.createContext<TypeMapContext>({
  mapId: '',
  interaction: 'dynamic',
});

/**
 * Type used for the map context
 */
type TypeMapContext = {
  mapId: string;
  interaction: TypeInteraction;
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
  const { mapFeaturesConfig } = props;

  const mapContextValue = useMemo(() => {
    return { mapId: mapFeaturesConfig.mapId as string, interaction: mapFeaturesConfig.map.interaction };
  }, [mapFeaturesConfig.mapId, mapFeaturesConfig.map.interaction]);

  /**
   * Create maps from inline configs with class name llwp-map in index.html
   */
  function getInlineMaps() {
    const i18nInstance = i18n.cloneInstance({
      lng: mapFeaturesConfig.displayLanguage,
      fallbackLng: mapFeaturesConfig.displayLanguage,
    });

    // create a new map instance
    // eslint-disable-next-line no-new
    new MapViewer(mapFeaturesConfig, i18nInstance);

    return (
      <I18nextProvider i18n={i18nInstance}>
        <MapContext.Provider value={mapContextValue}>
          <ThemeProvider theme={getTheme(mapFeaturesConfig.theme)}>
            <Shell shellId={mapFeaturesConfig.mapId as string} mapFeaturesConfig={mapFeaturesConfig} />
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
