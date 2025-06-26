import { GeoChartConfig as ExternalGeoChartConfig, ChartType } from 'geochart';
import { GeoChartConfig as CoreGeoChartConfig } from 'geoview-core/core/utils/config/reader/uuid-config-reader';

// Create a type that combines both GeoChartConfig types
export type CombinedGeoChartConfig<TType extends ChartType> = ExternalGeoChartConfig<TType> & CoreGeoChartConfig;

/**
 * Definition of options for all charts used by the plugin.
 */
export type PluginGeoChartConfig<TType extends ChartType> = {
  charts: GeoViewGeoChartConfig<TType>[];
};

/**
 * Definition of options for each type of chart used for by the plugin.
 */
export type GeoViewGeoChartConfig<TType extends ChartType> = CombinedGeoChartConfig<TType> & {
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
