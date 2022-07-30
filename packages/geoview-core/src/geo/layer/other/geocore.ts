import { api } from '../../../app';
import { catalogUrl } from '../../../core/utils/config/config';
import { TypeGeoviewLayerConfig, TypeGeoCoreLayerEntryConfig } from '../../map/map-schema-types';
import { CONST_LAYER_TYPES } from '../geoview-layers/abstract-geoview-layers';
import { UUIDmapConfigReader } from '../../../core/utils/config/reader/uuid-config-reader';

export interface TypeGeoCoreLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
  geoviewLayerType: 'geoCore';
  listOfLayerEntryConfig?: TypeGeoCoreLayerEntryConfig[];
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
    const url = layerConfig.accessPath || `${catalogUrl}/${api.map(this.mapId).displayLanguage.split('-')[0]}`;
    const requestUrl = `${url}/${layerConfig.id}`;
    const geoviewLayerConfigList = await UUIDmapConfigReader.getGVlayersConfigFromUUID(this.mapId, requestUrl);
    return geoviewLayerConfigList.length > 0 ? geoviewLayerConfigList[0] : null;
  }
}
