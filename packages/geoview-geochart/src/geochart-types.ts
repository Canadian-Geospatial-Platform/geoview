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
  layers?: GeoViewGeoChartConfigLayer[];
};

/**
 * Definition of options used for the layers definition in the plugin.
 */
export type GeoViewGeoChartConfigLayer = {
  layerId: string;
  propertyValue: string;
  propertyDisplay?: string;
  query?: GeoViewGeoChartConfigLayerQuery;
};

/**
 * Definition of query parameters used to fetch further information to build the Datasources
 */
export type GeoViewGeoChartConfigLayerQuery = {
  type: LayerQueryType;
  lazyLoading: boolean;
  url: string;
  urlOptions: GeoViewGeoChartConfigLayerQueryOptions<LayerQueryType>;
};

/**
 * Definition of LayerQueryType parameters, used to fetch further information to build the Datasources
 */
export type GeoViewGeoChartConfigLayerQueryOptions<TType extends LayerQueryType = LayerQueryType> = {
  [key in TType]: GeoViewGeoChartConfigLayerQueryRegistry[key]['urlOptions'];
}[TType];

/**
 * The different types of layer queries supported by GeoChart Plugin and their different Options
 */
export type LayerQueryType = keyof GeoViewGeoChartConfigLayerQueryRegistry;
export type GeoViewGeoChartConfigLayerQueryRegistry = {
  esriRegular: {
    urlOptions: GeoViewGeoChartConfigLayerQueryOptionEsriRegular;
  };
  esriRelatedRecords: {
    urlOptions: GeoViewGeoChartConfigLayerQueryOptionEsriRelated;
  };
};

/**
 * The Options to query a layer of EsriRegular type
 */
export type GeoViewGeoChartConfigLayerQueryOptionEsriRegular = {
  whereClauses: GeoViewGeoChartConfigLayerQueryOptionClause[];
  orderByField: string;
};

/**
 * The Options to query a layer of EsriRelated type
 */
export type GeoViewGeoChartConfigLayerQueryOptionEsriRelated = {
  relationshipId: number;
  objectIdField: string;
};

export type GeoViewGeoChartConfigLayerQueryOptionClause = {
  field: string;
  literal?: string;
  valueFrom?: string;
  prefix?: string;
  suffix?: string;
};
