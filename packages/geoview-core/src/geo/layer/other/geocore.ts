import axios from 'axios';

import { snackbarMessagePayload } from '../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../api/events/event-types';

import { api } from '../../../app';

import { TypeJsonObject } from '../../../core/types/global-types';
import { catalogUrl, Config } from '../../../core/utils/config';
import { TypeGeoviewLayerConfig } from '../../map/map-types';
import { TypeGeoCoreLayerEntryConfig } from '../geoview-layers/schema-types';
import { CONST_LAYER_TYPES } from '../geoview-layers/abstract-geoview-layers';

export interface TypeGeoCoreLayerConfig extends Omit<TypeGeoviewLayerConfig, 'layerEntries' | 'geoviewLayerType'> {
  geoviewLayerType: 'geoCore';
  layerEntries?: TypeGeoCoreLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeGeoCoreLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is GEOCORE. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const layerConfigIsGeoCore = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeGeoCoreLayerConfig => {
  return verifyIfLayer.geoviewLayerType === CONST_LAYER_TYPES.GEOCORE;
};

/**
 * Class used to add geoCore layer to the map
 *
 * @exports
 * @class GeoCore
 */
export class GeoCore {
  private mapId: string;

  /**
   * Initialize layer
   * @param {string} mapId the id of the map
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Get layer from uuid
   *
   * @param {TypeGeoCoreLayerEntryConfig} layerConfig the layer configuration
   * @return {Promise<TypeGeoviewLayerConfig | null>} layers to add to the map
   */
  async createLayer(layerConfig: TypeGeoCoreLayerConfig): Promise<TypeGeoviewLayerConfig | null> {
    const url = layerConfig.accessPath || `${catalogUrl}/${api.map(this.mapId).languages[0].split('-')[0]}`;

    const requestUrl = `${url}/${layerConfig.id}`;

    try {
      const result = await axios.get<TypeJsonObject>(requestUrl);

      const layers: TypeGeoviewLayerConfig[] = Config.getLayerConfigFromUUID(result);

      return layers && layers.length > 0 ? layers[0] : null;
    } catch (error: unknown) {
      api.event.emit(
        snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
          type: 'key',
          value: 'validation.layer.loadfailed',
          params: [error as TypeJsonObject, this.mapId as TypeJsonObject],
        })
      );
    }

    return null;
  }
}
