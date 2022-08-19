import { api } from '../../../app';
import { catalogUrl } from '../../../core/utils/config/config';
import {
  TypeLayerEntryConfig,
  TypeGeoviewLayerConfig,
  TypeGeocoreLayerEntryConfig,
  TypeListOfGeoviewLayerConfig,
} from '../../map/map-schema-types';
import { CONST_LAYER_TYPES } from '../geoview-layers/abstract-geoview-layers';
import { UUIDmapConfigReader } from '../../../core/utils/config/reader/uuid-config-reader';

export interface TypeGeoCoreLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
  geoviewLayerType: 'geoCore';
  listOfLayerEntryConfig: TypeGeocoreLayerEntryConfig[];
}

/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeGeocoreLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is GEOCORE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is valid
 *
 * @return {boolean} true if the type ascention is valid
 */
export const geoviewEntryIsGeocore = (verifyIfGeoViewEntry: TypeLayerEntryConfig): verifyIfGeoViewEntry is TypeGeocoreLayerEntryConfig => {
  return verifyIfGeoViewEntry.geoviewRootLayer!.geoviewLayerType === CONST_LAYER_TYPES.GEOCORE;
};

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
   * Get GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
   *
   * @param {TypeGeocoreLayerEntryConfig} layerConfig the layer configuration
   * @return {Promise<TypeListOfGeoviewLayerConfig>} list of layer configurations to add to the map
   */
  createLayers(layerConfig: TypeGeoCoreLayerConfig): Promise<TypeListOfGeoviewLayerConfig[]> {
    const listOfGeoviewLayerConfig = new Promise<TypeListOfGeoviewLayerConfig[]>((resolve) => {
      const url = layerConfig.metadataAccessPath || `${catalogUrl}/${api.map(this.mapId).displayLanguage}`;
      const promiseOfLayerConfigs: Promise<TypeListOfGeoviewLayerConfig>[] = [];
      layerConfig.listOfLayerEntryConfig.forEach((layerEntry: TypeLayerEntryConfig) => {
        const requestUrl = `${url}/${layerEntry.layerId}`;
        promiseOfLayerConfigs.push(UUIDmapConfigReader.getGVlayersConfigFromUUID(this.mapId, requestUrl));
      });
      Promise.all(promiseOfLayerConfigs).then((listOfLayerCreated) => {
        resolve(listOfLayerCreated);
      });
    });
    return listOfGeoviewLayerConfig;
  }
}
