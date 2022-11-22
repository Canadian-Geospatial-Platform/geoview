import { createElement } from 'react';
import { api } from '../../../app';
import { Legend } from './legend';
import { LegendItem, TypeLegendItemProps } from './legend-item';

/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export class LegendApi {
  mapId!: string;

  /**
   * initialize the legend api
   *
   * @param mapId the id of the map this legend belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a legend
   *
   */
  createLegend = () => {
    return Legend;
  };

  /**
   * Create an individual legend item
   *
   */
  createLegendItem = (props: TypeLegendItemProps) => {
    const { layerId } = props;
    const geoviewLayerInstance = api.map(this.mapId).layer.geoviewLayers[layerId];
    return createElement(LegendItem, { layerId, geoviewLayerInstance });
  };
}
