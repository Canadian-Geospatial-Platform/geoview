import { TypeJsonObject } from 'geoview-core/src/core/types/global-types';
import { TypeFeatureInfoEntry, TypeFeatureInfoEntryPartial, TypeLayerEntryConfig } from 'geoview-core/src/geo/map/map-schema-types';
import { ChartType, GeoChartDatasource } from 'geochart';
import { LayerApi } from 'geoview-core/src/geo/layer/layer';
import { TypeGeochartResultSetEntry } from 'geoview-core/src/core/stores/store-interface-and-intial-values/geochart-state';
import { PluginGeoChartConfig, GeoViewGeoChartConfig, GeoViewGeoChartConfigLayer } from './geochart-types';

/**
 * Finds, if any, the layer configuration in the plugin configuration that's associated with the layer id given.
 * When more than one could be found, the first one is returned.
 * @param config PluginGeoChartConfig<ChartType> The complete GeoChart Plugin configuration
 * @param layerId string The layer id to search the layer config for
 * @return [GeoViewGeoChartConfig<ChartType> | undefined, GeoViewGeoChartConfigLayer | undefined]
 * The GeoViewGeoChartConfig and GeoViewGeoChartConfigLayer configurations
 */
const findLayerConfig = (
  config: PluginGeoChartConfig<ChartType>,
  layerId: string
): [GeoViewGeoChartConfig<ChartType> | undefined, GeoViewGeoChartConfigLayer | undefined] => {
  // Find the chart plugin layer config that works with layer that contains found data
  // For each chart plugin config that works with a layer config
  let foundConfigChart: GeoViewGeoChartConfig<ChartType> | undefined;
  let foundConfigLyr: GeoViewGeoChartConfigLayer | undefined;
  config.charts
    .filter((x: GeoViewGeoChartConfig<ChartType>) => {
      return x.layers;
    })
    .forEach((c: GeoViewGeoChartConfig<ChartType>) => {
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
 * Simplifies the FeatureInfoEntries into more straightforward TypeJsonObjects.
 * @param entries TypeFeatureInfoEntryPartial[] The FeatureInfoEntries to simplify
 * @return TypeJsonObject[] The simplified JsonObject of the attributes
 */
const simplifyTypeFeatureInfoEntries = (entries: TypeFeatureInfoEntryPartial[]): TypeJsonObject[] => {
  // Simplify attributes
  return entries.map((entry: TypeFeatureInfoEntryPartial) => {
    // Return simplified object
    const obj: TypeJsonObject = {};
    Object.keys(entry.fieldInfo).forEach((k: string) => {
      // Build
      obj[k] = entry.fieldInfo[k]?.value as TypeJsonObject;
    });
    return obj;
  });
};

/**
 * Finds complete configuration necessary to build a GeoChart based on a given results set.
 * @param {PluginGeoChartConfig<ChartType>} config - The complete GeoChart Plugin configuration
 * @param {LayerApi} layerApi - The GeoView core layer api
 * @param {TypeLayerData[]} layerDataArray - The Results set of results to search for a chart
 * @return [
    GeoViewGeoChartConfig<ChartType> | undefined,
    GeoViewGeoChartConfigLayer | undefined,
    TypeLayerEntryConfig<ChartType> | undefined,
    TypeFeatureInfoEntry[] | undefined
  ] An array of information retrieved from the results set to eventually send to the GeoChart component
 */
export const findLayerDataAndConfigFromQueryResults = (
  config: PluginGeoChartConfig<ChartType>,
  layerApi: LayerApi,
  layerDataArray: TypeGeochartResultSetEntry[]
): [
  GeoViewGeoChartConfig<ChartType> | undefined,
  GeoViewGeoChartConfigLayer | undefined,
  TypeLayerEntryConfig | undefined,
  TypeFeatureInfoEntry[] | undefined
] => {
  // Loop on the results set
  let foundConfigChart: GeoViewGeoChartConfig<ChartType> | undefined;
  let foundConfigChartLyr: GeoViewGeoChartConfigLayer | undefined;
  let foundLayerEntry: TypeLayerEntryConfig | undefined;
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
 * @param configChart GeoViewGeoChartConfig<ChartType> The complete GeoChart Config
 * @param configChartLayer GeoViewGeoChartConfigLayer The layers configuration for the GeoChart Config (if existing)
 * @param layerData TypeFeatureInfoEntryPartial[] The Results set of records to load in the Datasource (when already existing)
 * @return Promise<GeoViewGeoChartConfig<ChartType>> An promise to return a GeoViewGeoChartConfig<ChartType> with the
 * final Datasource to send to GeoChart.
 */
export const loadDatasources = (
  configChart: GeoViewGeoChartConfig<ChartType>,
  configChartLayer: GeoViewGeoChartConfigLayer,
  layerData: TypeFeatureInfoEntryPartial[]
): GeoViewGeoChartConfig<ChartType> => {
  // The new Plugin input to be returned
  // Cloning it in the process to make sure we're detaching ourselves from the configuration plugin object
  const retConfigChart: GeoViewGeoChartConfig<ChartType> = { ...configChart };

  // If there's no datasources associated with the chart config, figure it out!
  if (!retConfigChart.datasources) {
    // Create the datasources
    retConfigChart.datasources = [];

    // The layer data simplified
    const layerDataSimplified = simplifyTypeFeatureInfoEntries(layerData);

    // If there's a query property to indicate how to query the data, we're altering the datasources
    if (configChart?.query) {
      // For each previously found data
      layerDataSimplified.forEach((lyrDataSimp: TypeJsonObject) => {
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
