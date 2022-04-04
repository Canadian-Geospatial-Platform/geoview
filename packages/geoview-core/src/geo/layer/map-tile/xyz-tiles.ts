import L, { Layer } from 'leaflet';
import { api } from '../../../api/api';

import { TypeXYZTiles } from '../../../core/types/cgpv-types';
import { generateId } from '../../../core/utils/utilities';

// TODO: Implement method to validate XYZ tile service
//
// NOTE: The signature of tile services may vary depending of if it's a dynamic or static tile service. Dynamic tile services solutions like TiTiler allows users
// to define query parameters such as a COG url, a TileMatrixSet and a resampling method.
// e.g.: http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png?url=http://smtg/cog.tif&TileMatrixSetId=CanadianNAD83_LCC&resampling_method=bilinear

// TODO: Add more customization (minZoom, maxZoom, TMS)

/**
 * a class to add xyz-tiles layer
 *
 * @export
 * @class XYZTiles
 */
export class XYZTiles {
  // layer id with default
  id: string;

  // layer name with default
  name?: string = 'XYZ Tiles';

  // layer type
  type: string;

  // layer from leaflet
  layer: Layer | string;

  // layer or layer service url
  url: string;

  // map id
  #mapId: string;

  /**
   * Initialize layer
   *
   * @param {string} mapId the id of the map
   * @param {TypeXYZTiles} layerConfig the layer configuration
   */
  constructor(mapId: string, layerConfig: TypeXYZTiles) {
    this.#mapId = mapId;

    this.id = layerConfig.id || generateId('');
    if (layerConfig.name) this.name = layerConfig.name[api.map(this.#mapId).getLanguageCode()];
    this.type = layerConfig.layerType;
    this.url = layerConfig.url[api.map(this.#mapId).getLanguageCode()];
    this.layer = new Layer();
  }

  /**
   * Add a XYZ Tiles layer to the map.
   *
   * @param {TypeXYZTiles} layer the layer configuration
   * @return {Promise<Layer | string>} layers to add to the map
   */
  add(layer: TypeXYZTiles): Promise<Layer | string> {
    const geo = new Promise<Layer | string>((resolve) => {
      console.log(layer.url[api.map(this.#mapId).getLanguageCode()]);

      const xyzTiles = L.tileLayer(layer.url[api.map(this.#mapId).getLanguageCode()]);

      resolve(xyzTiles);
    });
    return geo;
  }

  /**
   * Set Layer Opacity
   * @param {number} opacity layer opacity
   */
  setOpacity = (opacity: number) => {
    this.layer.setOpacity(opacity);
  };

  /**
   * Get bounds through Leaflet built-in functions
   *
   * @returns {L.LatLngBounds} layer bounds
   */
  getBounds = (): L.LatLngBounds =>
    L.latLngBounds([
      [-85.05112877980660357, -180],
      [85.05112877980660357, 180],
    ]);
}
