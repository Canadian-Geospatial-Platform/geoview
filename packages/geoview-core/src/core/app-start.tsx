import React, { Suspense, useMemo } from 'react';

import './translation/i18n';
import i18n from 'i18next';
import { I18nextProvider } from 'react-i18next';

import { ThemeProvider, Theme, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { Shell } from './containers/shell';
import { theme } from '../ui/style/theme';
import { MapViewer } from '../geo/map/map';

import { TypeMapConfigProps, TypeMapContext } from './types/cgpv-types';

declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}

// create a state that will hold map config information
export const MapContext = React.createContext<TypeMapContext>({
  id: '',
});

/**
 * interface used when passing configuration from the maps
 */
interface AppStartProps {
  configObj: TypeMapConfigProps;
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
function AppStart(props: AppStartProps): JSX.Element {
  const { configObj } = props;

  const mapContextValue = useMemo(() => {
    return { id: configObj.id };
  }, [configObj.id]);

  /**
   * Create maps from inline configs with class name llwp-map in index.html
   */
  function getInlineMaps() {
    const i18nInstance = i18n.cloneInstance({
      lng: configObj.language,
      fallbackLng: configObj.language,
    });

    // create a new map instance
    // eslint-disable-next-line no-new
    new MapViewer(configObj, i18nInstance);

    return (
      <I18nextProvider i18n={i18nInstance}>
        <MapContext.Provider value={mapContextValue}>
          <Shell id={configObj.id} config={configObj} />
        </MapContext.Provider>
      </I18nextProvider>
    );
  }

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <Suspense fallback="">
          <CssBaseline />
          {getInlineMaps()}
        </Suspense>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default AppStart;
