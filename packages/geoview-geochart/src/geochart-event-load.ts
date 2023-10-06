import { GeoChartConfig, ChartType } from 'geochart';
import { PayloadBaseClassChart, EVENT_CHART_LOAD } from './geochart-event-base';

/**
 * Class definition for PayloadChartLoad
 *
 * @exports
 * @class PayloadChartLoad
 * @extends PayloadBaseClassChart
 */
export class PayloadChartLoad extends PayloadBaseClassChart {
  /**
   * The data in the payload
   */
  inputs?: GeoChartConfig<ChartType>;

  /**
   * Constructor
   * @param handlerName the handler name key
   * @param data the data to load in the chart
   * @param options the options to load in the chart
   */
  constructor(handlerName: string | null, inputs?: GeoChartConfig<ChartType>) {
    super(EVENT_CHART_LOAD, handlerName);
    this.inputs = inputs;
  }
}
