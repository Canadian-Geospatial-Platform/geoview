import { initMapDivFromFunctionCall, api } from '@/app';

/**
 * Create a new map in a given div
 *
 * @param {string} divId ID of div to create map in
 * @param {string} mapConfig a new config passed in from the function call
 */
export function createMapFromConfig(divId: string, mapConfig: string) {
  const mapDiv = document.getElementById(divId);
  if (mapDiv) {
    if (mapDiv.classList.contains('llwp-map')) api.maps[divId].loadMapFromJsonStringConfig(mapConfig);
    else initMapDivFromFunctionCall(mapDiv!, mapConfig);
  } else {
    // eslint-disable-next-line no-console
    console.error(`Div with id ${divId} does not exist`);
  }
}
