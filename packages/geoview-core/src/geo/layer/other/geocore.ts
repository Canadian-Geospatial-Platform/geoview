import axios from 'axios';

import { snackbarMessagePayload } from '../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../api/events/event';

import { api } from '../../../app';

import {
  CONST_LAYER_TYPES,
  TypeGeoCoreLayer,
  TypeLayerConfig,
  TypeBaseWebLayersConfig,
  TypeJsonObject,
} from '../../../core/types/cgpv-types';
import { catalogUrl, Config } from '../../../core/utils/config';

export const layerConfigIsGeoCore = (verifyIfLayer: Omit<TypeBaseWebLayersConfig, 'url'>): verifyIfLayer is TypeGeoCoreLayer => {
  return verifyIfLayer.layerType === CONST_LAYER_TYPES.GEOCORE;
};

/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  #mapId: string;

  /**
   * Initialize layer
   * @param {string} mapId the id of the map
   */
  constructor(mapId: string) {
    this.#mapId = mapId;
  }

  /**
   * Get layer from uuid
   *
   * @param {TypeGeoCoreLayer} layer the layer configuration
   * @return {Promise<TypeLayerConfig | null>} layers to add to the map
   */
  async add(layer: TypeGeoCoreLayer): Promise<TypeLayerConfig | null> {
    const url = layer.url || `${catalogUrl}/${api.map(this.#mapId).language.split('-')[0]}`;

    const requestUrl = `${url}/${layer.id}`;

    try {
      const result = await axios.get<TypeJsonObject>(requestUrl);

      const layers: TypeLayerConfig[] = Config.getLayerConfigFromUUID(result);

      return layers && layers.length > 0 ? layers[0] : null;
    } catch (error: unknown) {
      api.event.emit(
        snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.#mapId, {
          type: 'key',
          value: 'validation.layer.loadfailed',
          params: [error as TypeJsonObject, this.#mapId as TypeJsonObject],
        })
      );
    }

    return null;
  }
}
