import { createElement } from 'react';
import { Layers } from './layers';

/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export class LayersApi {
  /**
   * Create a legend as an element
   */
  createLayers = () => {
    return createElement(Layers);
  };
}
