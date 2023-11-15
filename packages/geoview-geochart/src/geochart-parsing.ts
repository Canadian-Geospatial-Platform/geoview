import { TypeLayerEntryConfig, TypeJsonObject } from 'geoview-core';
import { ChartType, GeoChartDatasource } from 'geochart';
import {
  TypeArrayOfLayerData,
  TypeLayerData,
  TypeFeatureInfoEntry,
  TypeFeatureInfoEntryPartial,
} from 'geoview-core/src/api/events/payloads';
import { queryRecordsByUrl, queryRelatedRecordsByUrl } from 'geoview-core/src/geo/layer/geoview-layers/esri-layer-common';
import {
  PluginGeoChartConfig,
  GeoViewGeoChartConfig,
  GeoViewGeoChartConfigLayer,
  GeoViewGeoChartConfigLayerQueryOptions,
  GeoViewGeoChartConfigLayerQueryOptionClause,
} from './geochart-types';

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
 * @param entries TypeFeatureInfoEntryPartial[] The FeatureInfoEntries to simplify
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
  layerDataArray: TypeArrayOfLayerData
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
  layerDataArray.forEach((layerData: TypeLayerData) => {
    // If still not found data corresponding to a layer config
    if (!foundData) {
      // If found something
      if (layerData.features && layerData.features.length > 0) {
        // Find the layer config associated with the dada
        [foundConfigChart, foundConfigChartLyr] = findLayerConfig(config, layerData.layerPath);

        // If found a corresponding layer config
        if (foundConfigChartLyr) {
          // Grab the layer entry config
          foundLayerEntry = registeredLayers[layerData.layerPath];

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
 * Builds a where clause string, to be used in an url, given the array of GeoViewGeoChartConfigLayerQueryOptionClauses.
 * @param whereClauses GeoViewGeoChartConfigLayerQueryOptionClauses[] The array of where clauses objects.
 * @param source TypeFeatureInfoEntryPartial The source to read the information from when building the clause.
 * @returns string Returns the where clause string
 */
const buildQueryWhereClause = (
  whereClauses: GeoViewGeoChartConfigLayerQueryOptionClause[],
  source: TypeFeatureInfoEntryPartial
): string => {
  // Loop on each url options
  let theWhereClause = '';
  if (whereClauses) {
    whereClauses.forEach((urlOpt: GeoViewGeoChartConfigLayerQueryOptionClause) => {
      // Read the value we want
      let val;
      if (urlOpt.literal) {
        // As-is replace
        val = urlOpt.literal;
      } else if (urlOpt.valueFrom) {
        // Value comes from the record object
        val = source.fieldInfo[urlOpt.valueFrom]?.value as string;
      }
      // If value was read, concatenate to the where clause
      if (val) {
        val = `${urlOpt.prefix || ''}${val}${urlOpt.suffix || ''}`;
        val = encodeURIComponent(val);
        theWhereClause += `${urlOpt.field}=${val} AND `;
      }
    });
    theWhereClause = theWhereClause.replace(/ AND $/, '');
  }

  // Return the where clause
  return theWhereClause;
};

/**
 * Fetches the items that should be attached to the given Datasource.
 * @param layerConfig GeoViewGeoChartConfigLayer The layer configuration we're currently using.
 * @param datasource GeoChartDatasource The Datasource to grab items for
 * @returns TypeJsonObject[] Returns the items that should be attached to the Datasource
 */
export const fetchItemsViaQueryForDatasource = async (
  layerConfig: GeoViewGeoChartConfigLayer,
  datasource: GeoChartDatasource
): Promise<TypeJsonObject[]> => {
  // The query
  const query = layerConfig.query!;

  // Depending on the type of query
  let entries: TypeFeatureInfoEntryPartial[];
  // TODO: Refactor - Issue #1497
  if (query.type === 'esriRelatedRecords') {
    // The options
    const urlOptions = query.urlOptions as GeoViewGeoChartConfigLayerQueryOptions<'esriRelatedRecords'>;

    // Base query url
    let { url } = query;

    // Append the mandatory params
    url +=
      '/queryRelatedRecords?outFields=*&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnZ=false&returnM=false&gdbVersion=&datumTransformation=&definitionExpression=&f=json';

    // Build the relationshipId
    url += `&relationshipId=${urlOptions.relationshipId}`;

    // Build the object ids
    url += `&objectIds=${(datasource.sourceItem as TypeFeatureInfoEntryPartial).fieldInfo[urlOptions.objectIdField]?.value as string}`;

    // Query an Esri related table
    entries = await queryRelatedRecordsByUrl(url, 0);
  } else if (query.type === 'esriRegular') {
    // The options
    const urlOptions = query.urlOptions as GeoViewGeoChartConfigLayerQueryOptions<'esriRegular'>;

    // Base query url
    let { url } = query;

    // Append the mandatory params
    url += '/query?outFields=*&f=json';

    // Build the where clause of the url
    url += `&where=${buildQueryWhereClause(urlOptions.whereClauses, datasource.sourceItem as TypeFeatureInfoEntryPartial)}`;

    // Build the order by clause of the url
    url += `&orderByFields=${urlOptions.orderByField}`;

    // Query an Esri layer/table regular method
    entries = await queryRecordsByUrl(url);
  } else {
    throw Error('Unsupported query type to fetch the Datasource items.');
  }

  // Simplify for the GeoChart
  return simplifyAttributes(entries);
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
export const checkForDatasources = async (
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
    retConfigChart.datasources = [];

    // If there's a query property to indicate how to query the data, we're altering the datasources
    if (configChartLayer?.query) {
      // The list of promises that will be returning the final values
      const promises: Promise<TypeJsonObject[]>[] = [];

      // For each previously found data
      layerData.forEach(async (lyrData) => {
        // Read the id and from the found data
        const id = lyrData.fieldInfo[configChartLayer.propertyValue]?.value;
        let display: string | undefined;
        if (configChartLayer.propertyDisplay) display = lyrData.fieldInfo[configChartLayer.propertyDisplay]?.value as string;

        // Add a datasource
        const ds: GeoChartDatasource = {
          value: id as string,
          display: display as string,
          sourceItem: lyrData,
        };

        // Add it to the list
        retConfigChart.datasources.push(ds);

        // If not lazy loading, fetch now
        if (!configChartLayer.query!.lazyLoading) {
          // Create a promise for the fetch and add to the list
          const promise = fetchItemsViaQueryForDatasource(configChartLayer, ds);
          promises.push(promise);

          // Await for results to come in and update the datasource
          ds.items = await promise;
        }
      });

      // Await all promises, because of the forEach()
      await Promise.all(promises);
    } else {
      // Use the data as is
      // Add a datasource
      retConfigChart.datasources.push({
        display: 'Feature',
        sourceItem: layerData,
        items: simplifyAttributes(layerData),
      });
    }
  }

  // Return it
  return retConfigChart;
};
