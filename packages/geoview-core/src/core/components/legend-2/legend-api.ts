import { createElement } from 'react';
import { LegendsLayerSet, api } from '@/app';
import { LegendItem, TypeLegendItemProps } from './legend-items/legend-item';
import { TypeLegendProps } from './types';
import { Legend } from './legend';

// import { List } from '@/ui';

// export interface TypeLegendProps {
//   layerIds: string[];
//   isRemoveable?: boolean;
//   canSetOpacity?: boolean;
//   expandAll?: boolean;
//   hideAll?: boolean;
//   canZoomTo?: boolean;
// }

/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export class Legend2Api {
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
  createLegend = (props: TypeLegendProps) => {
    // const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll } = props;
    // api.event.emit({ handlerName: `${this.mapId}/$LegendsLayerSet$`, event: api.eventNames.GET_LEGENDS.TRIGGER });
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
    return createElement(Legend, {
      ...props,
      mapId: this.mapId,
    });
    // return createElement('div', {}, createElement(List, { sx: { width: '100%' } }, legendItems));
  };

  /**
   * Create an individual legend item
   *
   */
  createLegendItem = (props: TypeLegendItemProps) => {
    const { layerId } = props;
    const geoviewLayerInstance = api.maps[this.mapId].layer.geoviewLayers[layerId];
    return createElement(LegendItem, { layerId, geoviewLayerInstance, key: layerId });
  };
}
