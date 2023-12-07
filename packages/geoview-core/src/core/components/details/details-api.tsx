import { createElement, ReactElement } from 'react';
import { Detailspanel } from './details-panel';

/**
 * API to manage details component
 *
 * @exports
 * @class DetailsAPI
 */
export class DetailsApi {
  /**
   * Create a details as an element
   *
   * @return {ReactElement} the details react element
   */
  createDetails = (): ReactElement => {
    return createElement(Detailspanel);
  };
}
