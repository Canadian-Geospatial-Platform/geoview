/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { Suspense } from "react";

import "./translation/i18n";
import i18n from "i18next";
import { I18nextProvider } from "react-i18next";

import parse, { attributesToProps } from "html-react-parser";

import { ThemeProvider, Theme, StyledEngineProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import { Element } from "domhandler";
import { Config } from "./utils/config";
import { Shell } from "./containers/shell";
import { theme } from "../ui/style/theme";
import { MapViewer } from "../geo/map/map";


declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}


/**
 * interface used when passing html elements from the html pages
 */
interface AppStartProps {
  html: string;
}

/**
 * Initialize the app with maps from inline html configs, url params
 */
const AppStart = (props: AppStartProps): JSX.Element => {
  const { html } = props;

  /**
   * Create maps from inline configs with class name llwp-map in index.html
   */
  function getInlineMaps() {
    return parse(html, {
      trim: true,
      replace: (domNode) => {
        const domNodeElement = domNode as Element;
        // parse map config and create maps
        if (
          domNodeElement.attribs &&
          domNodeElement.attribs.class &&
          domNodeElement.attribs.class.indexOf("llwp-map") >= 0
        ) {
          // validate configuration and appply default if problem occurs then setup language
          const configObj = new Config(
            domNodeElement.attribs.id,
            (domNodeElement.attribs["data-leaflet"] || "")?.replace(/'/g, '"')
          );

          const i18nInstance = i18n.cloneInstance({
            lng: configObj.language,
            fallbackLng: configObj.language,
          });

          // create a new map instance
          const mapInstance = new MapViewer(
            configObj.configuration,
            i18nInstance
          );

          return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <div {...attributesToProps(domNodeElement.attribs)}>
              <I18nextProvider i18n={i18nInstance}>
                <Shell id={configObj.id} config={configObj.configuration} />
              </I18nextProvider>
            </div>
          );
        }

        return null;
      },
    });
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
};

export default AppStart;
