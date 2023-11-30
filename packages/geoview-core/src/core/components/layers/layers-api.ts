import { createElement } from 'react';
import { LegendsLayerSet, api } from '@/app';
import { Layers } from './layers';

/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export class LayersApi {
  /**
   * initialize the legend api
   */
  constructor() {}

  /**
   * Create a legend as an element
   *
   */
  createLayers = () => {
    return createElement(Layers);
  };
}
