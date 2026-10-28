import React, { createElement } from 'react'; // This is the real React that's exported
import { createRoot } from 'react-dom/client'; // This is the real React-DOM that's exported
import * as translate from 'react-i18next'; // This is the real translate that's exported

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import * as UI from '@/ui';

import { API } from '@/api/api';
import type { MapViewerDelegate, TypeCGPV } from '@/core/types/global-types';
import { renderMap } from '@/core/map-mount';
import { useWhatChanged } from '@/core/utils/useWhatChanged';
import { logger } from '@/core/utils/logger';
import { generateId } from '@/core/utils/utilities';

// The next export allow to import the exernal-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/external-types';

export const api = new API();

let cgpvCallbackMapInit: MapViewerDelegate;
let cgpvCallbackMapReady: MapViewerDelegate;

/**
 * Initializes the cgpv and render it to root element
 */
function init(): void {
  const mapElements = document.getElementsByClassName('geoview-map');

  // loop through map elements on the page
  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as HTMLElement;
    if (!mapElement.classList.contains('geoview-map-func-call')) {
      // Render the map
      const promiseMapViewer = renderMap(api, mapElement);

      // The callback for the map init when the promiseMapInit will resolve
      const theCallbackMapInit = cgpvCallbackMapInit;

      // The callback for the map ready when the promiseMapInit will resolve
      const theCallbackMapReady = cgpvCallbackMapReady;

      // When the map viewer is created
      promiseMapViewer
        .then((theMapViewer) => {
          // Register when the map will be init
          theMapViewer.onMapInit((mapViewer) => {
            try {
              // Log
              logger.logInfo('Map initialized', mapViewer.mapId);

              // Callback about it
              theCallbackMapInit?.(theMapViewer);
            } catch (error: unknown) {
              // Log
              logger.logError('An error happened in the initialization callback.', error);
            }
          });

          // Register when the map viewer will have a map ready
          theMapViewer.onMapReady((mapViewer) => {
            // Log
            logger.logInfo('Map ready / layers registered', mapViewer.mapId);

            // Callback for that particular map
            theCallbackMapReady?.(mapViewer);
          });
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('promiseMapViewer in init in App', error);
        });
    }
  }
}

/**
 * Registers a callback when the map has been initialized
 *
 * @param callback - The callback to be called
 */
export function onMapInit(callback: MapViewerDelegate): void {
  // Keep the callback
  cgpvCallbackMapInit = callback;
}

/**
 * Registers a callback when the map has turned ready / layers were registered
 *
 * @param callback - The callback to be called
 */
export function onMapReady(callback: MapViewerDelegate): void {
  // Keep the callback
  cgpvCallbackMapReady = callback;
}

// cgpv object to be exported with the api for outside use
export const cgpv = {
  init,
  onMapInit,
  onMapReady,
  api,
  reactUtilities: {
    react: React,
    createRoot,
    createElement,
  },
  translate,
  ui: {
    useTheme,
    useMediaQuery,
    useWhatChanged,
    elements: UI,
  },
  logger,
} satisfies TypeCGPV;

// Tag the React with the cgpv flag to indicate it's Geoview's
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(cgpv.reactUtilities.react as any).geoview = `this is geoview's react ${generateId()}`;

// GV For debugging purposes with integration on various websites, we're keeping an array of cgpvs for now
window.cgpvs = window.cgpvs || [];
window.cgpvs.push(cgpv);
// If more than 1, log an error
if (window.cgpvs.length > 1) logger.logError('Multiple instances of cgpv loaded. Make sure you only inject cgpv-main.js once.');

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
window.cgpv = cgpv;
