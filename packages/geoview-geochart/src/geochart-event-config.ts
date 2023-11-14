import { ChartType } from 'geochart';
import { PluginGeoChartConfig } from './geochart-types';
import { PayloadBaseClassChart, EVENT_CHART_CONFIG } from './geochart-event-base';

/**
 * Class definition for PayloadChartConfig
 *
 * @exports
 * @class PayloadChartConfig
 * @extends PayloadBaseClassChart
 */
export class PayloadChartConfig extends PayloadBaseClassChart {
  /**
   * The data in the payload
   */
  config: PluginGeoChartConfig<ChartType>;

  /**
   * Constructor
   * @param handlerName the handler name key
   * @param data the data to load in the chart
   * @param options the options to load in the chart
   */
  constructor(handlerName: string | null, config: PluginGeoChartConfig<ChartType>) {
    super(EVENT_CHART_CONFIG, handlerName);
    this.config = config;
  }
}
