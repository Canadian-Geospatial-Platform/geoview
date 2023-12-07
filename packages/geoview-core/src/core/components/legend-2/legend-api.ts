import { createElement } from 'react';
import { Legend } from './legend';

/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export class Legend2Api {
  /**
   * Create a legend as an element
   *
   */
  createLegend = () => {
    return createElement(Legend);
  };
}
