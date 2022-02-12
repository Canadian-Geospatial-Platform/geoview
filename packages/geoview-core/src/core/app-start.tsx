/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { Suspense } from "react";

import "./translation/i18n";
import i18n from "i18next";
import { I18nextProvider } from "react-i18next";

import { ThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";

import { Config } from "./utils/config";
import { Shell } from "./containers/shell";
import { theme } from "../ui/style/theme";
import { MapViewer } from "../geo/map/map";

/**
 * interface used when passing configuration from the maps
 */
interface AppStartProps {
  configObj: Config;
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
const AppStart = (props: AppStartProps): JSX.Element => {
  const { configObj } = props;

  /**
   * Create maps from inline configs with class name llwp-map in index.html
   */
  function getInlineMaps() {
    const i18nInstance = i18n.cloneInstance({
      lng: configObj.language,
      fallbackLng: configObj.language,
    });

    // create a new map instance
    const mapInstance = new MapViewer(configObj.configuration, i18nInstance);

    return (
      <I18nextProvider i18n={i18nInstance}>
        <Shell id={configObj.id} config={configObj.configuration} />
      </I18nextProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Suspense fallback="">
        <CssBaseline />
        {getInlineMaps()}
      </Suspense>
    </ThemeProvider>
  );
};

export default AppStart;
