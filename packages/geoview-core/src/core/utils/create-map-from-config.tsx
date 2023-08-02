import { createRoot } from 'react-dom/client';
import { api } from '@/app';
import AppStart from '../app-start';
import { Config } from './config/config';
import { parseJSONConfig, removeCommentsFromJSON } from '@/core/utils/utilities';
import { Layer } from '@/geo/layer/layer';

/**
 * Create a new map in a given div
 *
 * @param {string} divId ID of div to create map in
 * @param {string} mapConfig a new config passed in from the function call
 */
export async function createMapFromConfig(divId: string, mapConfig: string) {
  const mapDiv = document.getElementById(divId);
  if (mapDiv) {
    if (mapDiv.classList.contains('llwp-map')) {
      api.maps[divId].loadMapConfig(mapConfig);
    } else {
      mapDiv.classList.add('llwp-map');
      api.maps[divId].layer = new Layer(divId);
      api.maps[divId].loadGeometries();
      // create a new config for this map element
      const config = new Config(mapDiv!);

      const configObjString = removeCommentsFromJSON(mapConfig);
      const parsedMapConfig = parseJSONConfig(configObjString);

      const configObj = config.getValidMapConfig(parsedMapConfig);

      // if valid config was provided
      if (configObj) {
        if (config.displayLanguage) {
          configObj!.displayLanguage = config.displayLanguage;
        }
        // render the map with the config
        const root = createRoot(mapDiv!);
        root.render(<AppStart mapFeaturesConfig={configObj} />);
      }
      api.maps[divId].loadMapConfig(mapConfig);
    }
  }
}
