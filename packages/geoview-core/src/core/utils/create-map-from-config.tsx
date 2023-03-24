import ReactDOM from 'react-dom';
import { api } from '../../app';
import AppStart from '../app-start';
import { Config } from './config/config';
import { parseJSONConfig, removeCommentsFromJSON } from './utilities';

/**
 * Create a new map in a given div
 *
 * @param {string} divId ID of div to create map in
 * @param {string} mapConfig a new config passed in from the function call
 */
export function createMapFromConfig(divId: string, mapConfig: string) {
  const mapDiv = document.getElementById(divId);
  if (mapDiv) {
    if (mapDiv.className === 'llwp-map') {
      api.map(divId).loadMapConfig(mapConfig);
    } else {
      mapDiv.classList.add('llwp-map');

      const configObjString = removeCommentsFromJSON(mapConfig);
      const parsedMapConfig = parseJSONConfig(configObjString);

      // create a new config for this map element
      const config = new Config(mapDiv);
      const configObj = config.getMapConfigFromFunc(parsedMapConfig);

      if (configObj) {
        // render the map with the config
        ReactDOM.render(<AppStart mapFeaturesConfig={configObj} />, mapDiv);
      }
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(`Div with id ${divId} does not exist`);
  }
}
