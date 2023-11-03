import { createElement } from 'react';
import { LegendsLayerSet, api } from '@/app';
import { TypeLegendProps } from './types';
import { Layers } from './layers';

/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export class LayersApi {
  mapId!: string;

  legendLayerSet: LegendsLayerSet;

  /**
   * initialize the legend api
   *
   * @param mapId the id of the map this legend belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
    this.legendLayerSet = api.getLegendsLayerSet(mapId);
  }

  /**
   * Create a legend as an element
   *
   */
  createLayers = (props: TypeLegendProps) => {
    // const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll } = props;
    // const legendItems = layerIds.map((layerId) => {
    //   const geoviewLayerInstance = api.maps[this.mapId].layer.geoviewLayers[layerId];
    //   if (geoviewLayerInstance) {
    //     return createElement(LegendItem, {
    //       key: `layerKey-${layerId}`,
    //       layerId,
    //       geoviewLayerInstance,
    //       isRemoveable,
    //       canSetOpacity,
    //       expandAll,
    //       hideAll,
    //       canZoomTo: true,
    //     });
    //   }
    //   return null;
    return createElement(Layers, {
      ...props,
      mapId: this.mapId,
    });
    // return createElement('div', {}, createElement(List, { sx: { width: '100%' } }, legendItems));
  };
}
