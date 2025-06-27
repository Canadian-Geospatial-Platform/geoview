import { GeoChartConfig, ChartType } from 'geochart';
import { GeoViewGeoChartConfig as GeoViewGeoChartCoreConfig } from 'geoview-core/core/utils/config/reader/uuid-config-reader';

/**
 * Definition of options used for the layers definition in the plugin.
 */
export type GeoViewGeoChartConfigLayer = {
  layerId: string;
  propertyValue: string;
  propertyDisplay?: string;
};

/**
 * Definition of options for each type of chart used for by the plugin.
 */
// GV This type is the geoview-geochart equivalent of the homonym 'GeoViewGeoChartConfig' in geoview-core\utils\reader\uuid-config-reader.ts
export type GeoViewGeoChartConfig<TType extends ChartType> = GeoChartConfig<TType> & {
  layers: GeoViewGeoChartConfigLayer[];
};

/**
 * Definition of options for all charts used by the plugin.
 */
export type PluginGeoChartConfig<TType extends ChartType> = {
  charts: GeoViewGeoChartConfig<TType>[];
};

/**
 * Explicit function to convert the GeoviewGeochart config from geoview-geochart package to type-equivalent type in the geoview-core package
 * @param {GeoViewGeoChartConfig<ChartType>} chartConfigObject - The config
 * @returns {GeoViewGeoChartCoreConfig} The core type-equivalent of the objects
 */
export function convertGeoViewGeoChartConfigToCore(chartConfigObject: GeoViewGeoChartConfig<ChartType>): GeoViewGeoChartCoreConfig {
  return chartConfigObject as unknown as GeoViewGeoChartCoreConfig;
}

/**
 * Explicit function to convert the GeoviewGeochart config from geoview-core package to type-equivalent type in the geoview-geochart package
 * @param {GeoViewGeoChartCoreConfig} chartConfigObject chartConfigObject - The config
 * @returns {GeoViewGeoChartConfig<ChartType>} The geoview-geochart type-equivalent of the objects
 */
export function convertGeoViewGeoChartConfigFromCore(chartConfigObject: GeoViewGeoChartCoreConfig): GeoViewGeoChartConfig<ChartType> {
  return chartConfigObject as unknown as GeoViewGeoChartConfig<ChartType>;
}
