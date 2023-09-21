import React from 'react';
import { createRoot } from 'react-dom/client';
import { addReloadListener, api } from '@/app';
import AppStart from '@/core/app-start';
import { getValidConfigFromString } from '@/core/utils/utilities';
import { addGeoViewStore } from '@/core/stores/stores-managers';

/**
 * Create a new map in a given div
 *
 * @param {string} divId ID of div to create map in
 * @param {string} mapConfig a new config passed in from the function call
 */
export function createMapFromConfig(divId: string, mapConfig: string) {
  const mapDiv = document.getElementById(divId);
  if (mapDiv) {
    if (mapDiv.classList.contains('llwp-map')) {
      api.maps[divId].loadMapFromJsonStringConfig(mapConfig);
    } else {
      mapDiv.classList.add('llwp-map');
      // render the map with the config
      const root = createRoot(mapDiv!);
      const configObj = getValidConfigFromString(mapConfig, mapDiv);
      addGeoViewStore(configObj);
      addReloadListener(divId);
      root.render(<AppStart mapFeaturesConfig={configObj} />);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(`Div with id ${divId} does not exist`);
  }
}
