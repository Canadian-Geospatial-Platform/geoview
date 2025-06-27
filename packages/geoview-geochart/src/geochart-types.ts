import { GeoChartConfig, ChartType } from 'geochart';

/**
 * Definition of options for all charts used by the plugin.
 */
export type PluginGeoChartConfig<TType extends ChartType> = {
  charts: GeoViewGeoChartConfig<TType>[];
};

/**
 * Definition of options for each type of chart used for by the plugin.
 */
export type GeoViewGeoChartConfig<TType extends ChartType> = GeoChartConfig<TType> & {
  layers: GeoViewGeoChartConfigLayer[];
};

/**
 * Definition of options used for the layers definition in the plugin.
 */
export type GeoViewGeoChartConfigLayer = {
  layerId: string;
  propertyValue: string;
  propertyDisplay?: string;
};
