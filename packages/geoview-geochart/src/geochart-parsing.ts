import { TypeFeatureInfoEntry, TypeFeatureInfoEntryPartial } from 'geoview-core/api/config/types/map-schema-types';
import { GeoChartDatasource } from 'geochart';
import { LayerApi } from 'geoview-core/geo/layer/layer';
import { TypeGeochartResultSetEntry } from 'geoview-core/core/stores/store-interface-and-intial-values/geochart-state';
import { ConfigBaseClass } from 'geoview-core/core/utils/config/validation-classes/config-base-class';
import { PluginGeoChartConfig, GeoViewGeoChartConfig, GeoViewGeoChartConfigLayer } from './geochart-types';

/**
 * Finds, if any, the layer configuration in the plugin configuration that's associated with the layer id given.
 * When more than one could be found, the first one is returned.
 * @param {PluginGeoChartConfig} config - The complete GeoChart Plugin configuration
 * @param {string} layerId - The layer id to search the layer config for
 * @return [GeoViewGeoChartConfig | undefined, GeoViewGeoChartConfigLayer | undefined]
 * The GeoViewGeoChartConfig and GeoViewGeoChartConfigLayer configurations
 */
const findLayerConfig = (
  config: PluginGeoChartConfig,
  layerId: string
): [GeoViewGeoChartConfig | undefined, GeoViewGeoChartConfigLayer | undefined] => {
  // Find the chart plugin layer config that works with layer that contains found data
  // For each chart plugin config that works with a layer config
  let foundConfigChart: GeoViewGeoChartConfig | undefined;
  let foundConfigLyr: GeoViewGeoChartConfigLayer | undefined;
  config.charts
    .filter((x: GeoViewGeoChartConfig) => {
      return x.layers;
    })
    .forEach((c: GeoViewGeoChartConfig) => {
      // If still not found
      if (!foundConfigLyr) {
        // Find the config that works with the layer (if any)
        const layerConfigs = c.layers.filter((x: GeoViewGeoChartConfigLayer) => {
          return x.layerId === layerId;
        });

        // If found any, take the first one and this will stop the loop
        if (layerConfigs.length > 0) {
          foundConfigChart = c;
          [foundConfigLyr] = layerConfigs;
        }
      }
    });

  // Return it when found
  return [foundConfigChart, foundConfigLyr];
};

/**
 * Simplifies the FeatureInfoEntries into more straightforward array of Record<string, unknown>.
 * @param {TypeFeatureInfoEntryPartial[]} entries - The FeatureInfoEntries to simplify
 * @return {Record<string, unknown>[]} The simplified JsonObject of the attributes
 */
const simplifyTypeFeatureInfoEntries = (entries: TypeFeatureInfoEntryPartial[]): Record<string, unknown>[] => {
  // Simplify attributes
  return entries.map((entry: TypeFeatureInfoEntryPartial) => {
    // Return simplified object
    const obj: Record<string, unknown> = {};
    Object.keys(entry.fieldInfo).forEach((k: string) => {
      // Build
      obj[k] = entry.fieldInfo[k]?.value;
    });
    return obj;
  });
};

/**
 * Finds complete configuration necessary to build a GeoChart based on a given results set.
 * @param {PluginGeoChartConfig} config - The complete GeoChart Plugin configuration
 * @param {LayerApi} layerApi - The GeoView core layer api
 * @param {TypeLayerData[]} layerDataArray - The Results set of results to search for a chart
 * @return [
    GeoViewGeoChartConfig | undefined,
    GeoViewGeoChartConfigLayer | undefined,
    TypeLayerEntryConfig | undefined,
    TypeFeatureInfoEntry[] | undefined
  ] An array of information retrieved from the results set to eventually send to the GeoChart component
 */
export const findLayerDataAndConfigFromQueryResults = (
  config: PluginGeoChartConfig,
  layerApi: LayerApi,
  layerDataArray: TypeGeochartResultSetEntry[]
): [
  GeoViewGeoChartConfig | undefined,
  GeoViewGeoChartConfigLayer | undefined,
  ConfigBaseClass | undefined,
  TypeFeatureInfoEntry[] | undefined,
] => {
  // Loop on the results set
  let foundConfigChart: GeoViewGeoChartConfig | undefined;
  let foundConfigChartLyr: GeoViewGeoChartConfigLayer | undefined;
  let foundLayerEntry: ConfigBaseClass | undefined;
  let foundData: TypeFeatureInfoEntry[] | undefined;
  layerDataArray.forEach((layerData) => {
    // If still not found data corresponding to a layer config
    if (!foundData) {
      // If found something
      if (layerData.features && layerData.features.length > 0) {
        // Find the layer config associated with the dada
        [foundConfigChart, foundConfigChartLyr] = findLayerConfig(config, layerData.layerPath);

        // If found a corresponding layer config
        if (foundConfigChartLyr) {
          // Grab the layer entry config associated with the layer path
          foundLayerEntry = layerApi.getLayerEntryConfig(layerData.layerPath);

          // Grab the working data and this will exit the loop
          foundData = layerData.features;
        }
      }
    }
  });

  // Return everything as array
  return [foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData];
};

/**
 * Reads the configChart, configChartLayer and layerData information to determine a course of action to do to build a Datasource.
 * The config might already have a Datasource attached to it, but most cases this function will fetch data from
 * somewhere to build a Datasource and attach it to the configChart.
 * @param {GeoViewGeoChartConfig} configChart - The complete GeoChart Config
 * @param {GeoViewGeoChartConfigLayer} configChartLayer - The layers configuration for the GeoChart Config (if existing)
 * @param {TypeFeatureInfoEntryPartial[]} layerData - The Results set of records to load in the Datasource (when already existing)
 * @return {GeoViewGeoChartConfig} An promise to return a GeoViewGeoChartConfig with the
 * final Datasource to send to GeoChart.
 */
export const loadDatasources = (
  configChart: GeoViewGeoChartConfig,
  configChartLayer: GeoViewGeoChartConfigLayer,
  layerData: TypeFeatureInfoEntryPartial[]
): GeoViewGeoChartConfig => {
  // The new Plugin input to be returned
  // Cloning it in the process to make sure we're detaching ourselves from the configuration plugin object
  const retConfigChart: GeoViewGeoChartConfig = { ...configChart };

  // If there's no datasources associated with the chart config, figure it out!
  if (!retConfigChart.datasources) {
    // Create the datasources
    retConfigChart.datasources = [];

    // The layer data simplified
    const layerDataSimplified = simplifyTypeFeatureInfoEntries(layerData);

    // If there's a query property to indicate how to query the data, we're altering the datasources
    if (configChart?.query) {
      // For each previously found data
      layerDataSimplified.forEach((lyrDataSimp) => {
        // Read the id and from the found data
        const id = lyrDataSimp[configChartLayer.propertyValue];
        let display: string | undefined;
        if (configChartLayer.propertyDisplay) display = lyrDataSimp[configChartLayer.propertyDisplay] as string;

        // Add a datasource
        const ds: GeoChartDatasource = {
          value: id as string,
          display: display as string,
          sourceItem: lyrDataSimp,
        };

        // Add it to the list
        retConfigChart.datasources.push(ds);
      });
    } else {
      // Use the data as is
      // Add a datasource
      retConfigChart.datasources.push({
        display: 'Feature',
        sourceItem: layerDataSimplified[0],
        items: layerDataSimplified,
      });
    }
  }

  // Return it
  return retConfigChart;
};
