import { createElement } from 'react';
import { LegendsLayerSet, api } from '@/app';
import { LegendItem, TypeLegendItemProps } from './legend-item';
import { TypeLegendProps } from './types';
import { Legend } from './legend';

/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export class LegendApi {
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
    return createElement(Legend, {
      ...props,
      mapId: this.mapId,
    });
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
