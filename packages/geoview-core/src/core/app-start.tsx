import React, { Suspense, useMemo } from 'react';

import './translation/i18n';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { Shell } from '@/core/containers/shell';
import { getTheme, cgpvTheme } from '@/ui/style/theme';
import { MapViewer } from '@/geo/map/map-viewer';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { api, TypeInteraction } from '@/app';

declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {
    iconImg: React.CSSProperties;
  }
}
// create a state that will hold map config information
export const MapContext = React.createContext<TypeMapContext>({
  mapId: '',
  interaction: 'dynamic',
  mapFeaturesConfig: undefined,
});

/**
 * Type used for the map context
 */
export type TypeMapContext = {
  mapId: string;
  interaction: TypeInteraction;
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
  const { mapFeaturesConfig } = props;

  const mapContextValue = useMemo(() => {
    return { mapId: mapFeaturesConfig.mapId as string, interaction: mapFeaturesConfig.map.interaction, mapFeaturesConfig };
  }, [mapFeaturesConfig]);

  /**
   * Create maps from inline configs with class name llwp-map in index.html
   */
  function getInlineMaps() {
    const i18nInstance = i18n.cloneInstance({
      lng: mapFeaturesConfig.displayLanguage,
      fallbackLng: mapFeaturesConfig.displayLanguage,
    });

    // create a new map viewer instance and add it to the api
    api.maps[mapFeaturesConfig.mapId] = new MapViewer(mapFeaturesConfig, i18nInstance);

    return (
      <I18nextProvider i18n={i18nInstance}>
        <MapContext.Provider value={mapContextValue}>
          <ThemeProvider theme={getTheme(mapFeaturesConfig.theme)}>
            <Shell shellId={mapFeaturesConfig.mapId as string} />
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
