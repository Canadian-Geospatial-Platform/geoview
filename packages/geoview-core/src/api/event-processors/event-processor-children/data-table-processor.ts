import { AbstractGeoViewVector, EsriDynamic, TypeLayerEntryConfig, api } from '@/app';

import { AbstractEventProcessor } from '../abstract-event-processor';

export class DataTableProcessor extends AbstractEventProcessor {
  /**
   * Filter the map based on filters set on date table.
   * @param {string} mapId  id of the map.
   * @param {string} layerPath  path of the layer
   * @param {string} filterStrings filters set on the data table
   * @param {boolean} isMapRecordExist filtered Map switch is on off.
   */
  static applyFilters(mapId: string, layerPath: string, filterStrings: string, isMapRecordExist: boolean) {
    const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayer(layerPath);
    const filterLayerConfig = api.maps[mapId].layer.registeredLayers[layerPath] as TypeLayerEntryConfig;

    if (isMapRecordExist && geoviewLayerInstance !== undefined && filterLayerConfig !== undefined && filterStrings.length) {
      (api.maps[mapId].layer.geoviewLayer(layerPath) as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(filterStrings);
    } else {
      (api.maps[mapId].layer.geoviewLayer(layerPath) as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter('');
    }
  }
}
