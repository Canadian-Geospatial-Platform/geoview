import { TypeLayerEntryConfig, TypeJsonObject } from 'geoview-core';
import { ChartType, GeoChartDatasource } from 'geochart';
import { TypeFeatureInfoResultSets, TypeFeatureInfoEntry, TypeFeatureInfoEntryPartial } from 'geoview-core/src/api/events/payloads';
import { queryRelatedRecordsByUrl } from 'geoview-core/src/geo/layer/geoview-layers/esri-layer-common';
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
        const layerConfigs = c.layers!.filter((x: GeoViewGeoChartConfigLayer) => {
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
 * @param entries TypeFeatureInfoEntryPartial[] The FeatureInfoEntries to simplified
 * @return TypeJsonObject[] The simplified JsonObject of the attributes
 */
const simplifyAttributes = (entries: TypeFeatureInfoEntryPartial[]): TypeJsonObject[] => {
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
 * @param config PluginGeoChartConfig<ChartType> The complete GeoChart Plugin configuration
 * @param registeredLayers { [layerEntryConfigId: string]: TypeLayerEntryConfig } The registered layers
 * @param resultsSet TypeFeatureInfoResultSets The Results set of results to be simplified
 * @return [
    GeoViewGeoChartConfig<ChartType> | undefined,
    GeoViewGeoChartConfigLayer | undefined,
    TypeLayerEntryConfig<ChartType> | undefined,
    TypeFeatureInfoEntry[] | undefined
  ] An array of information retrieved from the results set to eventually send to the GeoChart component
 */
export const findLayerDataAndConfigFromQueryResults = (
  config: PluginGeoChartConfig<ChartType>,
  registeredLayers: { [layerEntryConfigId: string]: TypeLayerEntryConfig },
  resultsSet: TypeFeatureInfoResultSets
): [
  GeoViewGeoChartConfig<ChartType> | undefined,
  GeoViewGeoChartConfigLayer | undefined,
  TypeLayerEntryConfig<ChartType> | undefined,
  TypeFeatureInfoEntry[] | undefined
] => {
  // Loop on the results set
  let foundConfigChart: GeoViewGeoChartConfig<ChartType> | undefined;
  let foundConfigChartLyr: GeoViewGeoChartConfigLayer | undefined;
  let foundLayerEntry: TypeLayerEntryConfig | undefined;
  let foundData: TypeFeatureInfoEntry[] | undefined;
  Object.keys(resultsSet).forEach((layerPath) => {
    // Read the result
    const res = resultsSet[layerPath];

    // If still not found data corresponding to a layer config
    if (!foundData) {
      // If found something
      if (res.data?.at_long_lat && res.data?.at_long_lat.length > 0) {
        // Find the layer config associated with the dada
        [foundConfigChart, foundConfigChartLyr] = findLayerConfig(config, layerPath);

        // If found a corresponding layer config
        if (foundConfigChartLyr) {
          // Grab the layer entry config
          foundLayerEntry = registeredLayers[layerPath];

          // Grab the working data and this will stop the loop
          foundData = res.data?.at_long_lat;
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
export const checkAndAttachDatasources = async (
  configChart: GeoViewGeoChartConfig<ChartType>,
  configChartLayer: GeoViewGeoChartConfigLayer,
  layerData: TypeFeatureInfoEntryPartial[]
): Promise<GeoViewGeoChartConfig<ChartType>> => {
  // The new Plugin input to be returned
  // Cloning it in the process to make sure we're detaching ourselves from the configuration plugin object
  const retConfigChart: GeoViewGeoChartConfig<ChartType> = { ...configChart };

  // If there's no datasources associated with the chart config, figure it out!
  if (!retConfigChart.datasources) {
    // Create the datasources
    const datasources: GeoChartDatasource[] = [];

    // If there's a query property to indicate how to query the data, we're altering the datasources
    if (configChartLayer?.query) {
      // If there's a url
      if (configChartLayer!.query.url) {
        // Query the url for each previously found data
        const promises: Promise<TypeFeatureInfoEntryPartial[]>[] = [];
        layerData.forEach(async (lyrData) => {
          // Read the id from the found data
          const id = lyrData.fieldInfo[configChartLayer.propertyValue]?.value;
          let display: string | undefined;
          if (configChartLayer.propertyDisplay) display = lyrData.fieldInfo[configChartLayer.propertyDisplay]?.value as string;

          // Prepare the query
          // eslint-disable-next-line no-template-curly-in-string
          const url = configChartLayer!.query!.url.replace('${id}', id as unknown as string);

          // Parse the layer into data
          const promise = queryRelatedRecordsByUrl(url, 0);
          promises.push(promise);

          // Await the results
          const featureInfoData: TypeFeatureInfoEntryPartial[] = await promise;

          // Add a datasource
          datasources.push({
            value: id,
            display,
            items: simplifyAttributes(featureInfoData),
          } as GeoChartDatasource);
        });

        // Await all promises, because of the forEach
        await Promise.all(promises);
      }
    } else {
      // Use the data as is
      // Add a datasource
      datasources.push({
        display: 'Feature',
        items: simplifyAttributes(layerData),
      });
    }

    // Attach to the property
    retConfigChart.datasources = datasources;
  }

  // Return it
  return retConfigChart;
};
