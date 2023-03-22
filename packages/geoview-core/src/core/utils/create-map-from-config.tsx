import ReactDOM from 'react-dom';
import AppStart from '../app-start';
import { Config } from './config/config';

/**
 * Create a new map in a given div
 *
 * @param {string} divId ID of div to create map in
 * @param {string} mapConfig a new config passed in from the function call
 */
export function createMapFromConfig(divId: string, mapConfig: string) {
  const mapDiv = document.getElementById(divId);
  if (mapDiv) {
    mapDiv.className = 'llwp-map';

    // Erase comments in the config file.
    const configObjStr = mapConfig
      .split(/(?<!\\)'/gm)
      .map((fragment, index) => {
        if (index % 2) return fragment.replaceAll(/\/\*/gm, String.fromCharCode(1)).replaceAll(/\*\//gm, String.fromCharCode(2));
        return fragment;
      })
      .join("'")
      .replaceAll(/\/\*(?<=\/\*)((?:.|\n|\r)*?)(?=\*\/)\*\//gm, '')
      .replaceAll(String.fromCharCode(1), '/*')
      .replaceAll(String.fromCharCode(2), '*/');

    // parse the config
    const parsedMapConfig = JSON.parse(
      configObjStr
        // remove CR and LF from the map config
        .replace(/(\r\n|\n|\r)/gm, '')
        // replace apostrophes not preceded by a backslash with quotes
        .replace(/(?<!\\)'/gm, '"')
        // replace apostrophes preceded by a backslash with a single apostrophe
        .replace(/\\'/gm, "'")
    );

    // create a new config for this map element
    const config = new Config(mapDiv);
    const configObj = config.getMapConfigFromFunc(parsedMapConfig);

    if (configObj) {
      // render the map with the config
      ReactDOM.render(<AppStart mapFeaturesConfig={configObj} />, mapDiv);
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(`Div with id ${divId} does not exist`);
  }
}
