import { createElement } from 'react';
import { api } from '../../../app';
import { Legend } from './legend';
import { LegendItem, TypeLegendItemProps } from './legend-item';
import { List } from '../../../ui';

export interface TypeLegendProps {
  layerIds: string[];
  isRemoveable?: boolean;
  canSetOpacity?: boolean;
  expandAll?: boolean;
  hideAll?: boolean;
  canZoomTo?: boolean;
}

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
   * Create a legend as a component
   * @deprecated
   */
  createLegendComponent = () => {
    return Legend;
  };

  /**
   * Create a legend as an element
   *
   */
  createLegend = (props: TypeLegendProps) => {
    const { layerIds, isRemoveable, canSetOpacity, expandAll, hideAll, canZoomTo } = props;
    const legendItems = layerIds.map((layerId) => {
      const geoviewLayerInstance = api.map(this.mapId).layer.geoviewLayers[layerId];
      return createElement(LegendItem, {
        key: `layerKey-${layerId}`,
        layerId,
        geoviewLayerInstance,
        isRemoveable,
        canSetOpacity,
        expandAll,
        hideAll,
        canZoomTo,
      });
    });
    return createElement('div', {}, createElement(List, { sx: { width: '100%' } }, legendItems));
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
