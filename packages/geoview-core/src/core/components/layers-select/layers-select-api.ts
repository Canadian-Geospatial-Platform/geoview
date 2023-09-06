import { createElement, ReactElement } from 'react';
import { LayersSelectProps } from './types';
import { LayersSelect } from './layers-select';

export class LayersSelectApi {
  mapId!: string;

  /**
   * initialize the layers select api
   *
   * @param mapId the id of the map this layers select belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a layers select as an element
   *
   * @param { 'materialReactDataTable'} tableType type of table that user want to create.
   * @return {ReactElement} the layers select react element
   */
  createLayersSelect = (data: LayersSelectProps): ReactElement => {
    return createElement(LayersSelect, data);
  };
}
