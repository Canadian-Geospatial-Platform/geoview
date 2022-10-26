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
    // TODO emit create legend event instead see issue 576
    // api.event.emit(legendPayload(EVENT_NAMES.FOOTER_TABS.EVENT_LEGEND_CREATE, this.mapId));
    return Legend;
  };

  /**
   * Create an individual legend item
   *
   */
  createLegendItem = (props: TypeLegendItemProps) => {
    const { layerId } = props;
    const rootGeoViewLayer = api.map(this.mapId).layer.geoviewLayers[layerId];
    return createElement(LegendItem, { layerId, rootGeoViewLayer });
  };
}
