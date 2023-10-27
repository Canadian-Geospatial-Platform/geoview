import { createElement } from 'react';
import { LegendsLayerSet, api } from '@/app';
import { TypeLegendProps } from '@/core/components/layers/types';
import { Legend } from './legend';

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
    return createElement(Legend, {
      ...props,
      mapId: this.mapId,
    });
  };
}
