/* eslint-disable no-console */
// TODO: Remove the no-console eslint above when component development stabilizes
import { TypeWindow, TypeLayerEntryConfig } from 'geoview-core';
import { useDetailsStoreLayerDataArray } from 'geoview-core/src/core/stores/store-interface-and-intial-values/details-state';
import {
  GeoChart as GeoChartComponent,
  GeoChartConfig,
  ChartType,
  ChartOptions,
  ChartData,
  GeoChartDefaultColors,
  GeoDefaultDataPoint,
  SchemaValidator,
  ValidatorResult,
  GeoChartAction,
  GeoChartDatasource,
} from 'geochart';
import {
  PayloadBaseClass,
  payloadIsQueryLayerQueryTypeAtLongLat,
  TypeArrayOfLayerData,
  TypeFeatureInfoEntry,
} from 'geoview-core/src/api/events/payloads';
import { findLayerDataAndConfigFromQueryResults, checkForDatasources, fetchItemsViaQueryForDatasource } from './geochart-parsing';
import { PluginGeoChartConfig, GeoViewGeoChartConfig, GeoViewGeoChartConfigLayer } from './geochart-types';
import { PayloadBaseClassChart, EVENT_CHART_CONFIG, EVENT_CHART_LOAD, EVENT_CHART_REDRAW } from './geochart-event-base';
import { PayloadChartConfig } from './geochart-event-config';
import { PayloadChartLoad } from './geochart-event-load';

/**
 * Essential properties for the GeoChart
 */
interface GeoChartProps {
  mapId: string;
  config: PluginGeoChartConfig<ChartType>;
  schemaValidator: SchemaValidator;
}

/**
 * The main React JSX Element which listens to events and updates the GeoChart ui
 * @param props GeoChartProps Essential properties for the GeoChart
 * @returns The Geochart JSX
 */
export function GeoChart(props: GeoChartProps): JSX.Element {
  // Fetch cgpv
  const w = window as TypeWindow;
  const { cgpv } = w;
  const { useTranslation } = cgpv;
  const { useTheme } = cgpv.ui;
  const { Box } = cgpv.ui.elements;
  const { useEffect, useState, useCallback } = cgpv.react;

  // Read props
  const { mapId, config: parentConfig, schemaValidator } = props;

  // Get the theme
  const theme = useTheme();

  // Get the translations
  const { t, i18n } = useTranslation<string>();

  // Tweak the default colors based on the theme
  const defaultColors: GeoChartDefaultColors = {
    backgroundColor: theme.palette.background.default,
    borderColor: theme.palette.border.primary,
    color: theme.palette.primary.main,
  };

  /** ****************************************** USE STATE SECTION START ************************************************ */

  // Use State
  const [config, setConfig] = useState<PluginGeoChartConfig<ChartType>>(parentConfig);
  const [configChartLayer, setConfigChartLayer] = useState<GeoViewGeoChartConfigLayer>();
  const [action, setAction] = useState<GeoChartAction>();
  const [inputs, setInputs] = useState<GeoChartConfig<ChartType>>();
  const [selectedDatasource, setSelectedDatasource] = useState<GeoChartDatasource>();
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>();
  const [isLoadingDatasource, setIsLoadingDatasource] = useState<boolean>();

  // Use Store
  const storeLayerDataArray = useDetailsStoreLayerDataArray();

  /** ****************************************** USE STATE SECTION END ************************************************** */
  /** ******************************************* CORE FUNCTIONS START ************************************************** */

  /**
   * Loads the chart with new inputs
   * @param newInputs GeoChartConfig<ChartType> | undefined The new inputs to load in the chart
   */
  const setChart = (newInputs?: GeoChartConfig<ChartType>): void => {
    // If some data is specified
    if (newInputs) {
      // Set data
      setInputs(newInputs!);
    }

    // Force a redraw
    setAction({ shouldRedraw: true });
  };

  /**
   * Fetches the items to associated to the given Datasource and then sets the Datasource in GeoChart
   * @param chartConfigLayer GeoViewGeoChartConfigLayer The chart layer configuration being used
   * @param ds GeoChartDatasource The Datasource to fetch the items for
   */
  const setDatasourceByFetchingItems = async (chartConfigLayer: GeoViewGeoChartConfigLayer, ds: GeoChartDatasource): Promise<void> => {
    try {
      // Loading
      setIsLoadingDatasource(true);

      // Fetch the items for the data source in question
      const newDs = { ...ds };
      newDs.items = await fetchItemsViaQueryForDatasource(chartConfigLayer, ds);

      // Set the selected datasource
      setSelectedDatasource(newDs);
    } finally {
      // Done
      setIsLoadingDatasource(false);
    }
  };

  /** ******************************************** CORE FUNCTIONS END *************************************************** */
  /** *************************************** EVENT HANDLERS SECTION START ********************************************** */

  /**
   * Handles when the chart must be redrawn.
   * @param e PayloadBaseClassChart The empty event payload
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChartRedraw = (e: PayloadBaseClassChart): void => {
    // Forces a redraw
    setAction({ shouldRedraw: true });
  };

  /**
   * Loads the config in the plugin
   * @param e PayloadChartConfig The payload with a new Chart configuration
   */
  const handleChartConfig = (e: PayloadChartConfig): void => {
    // Set the config
    setConfig(e.config);
  };

  /** **************************************** EVENT HANDLERS SECTION END *********************************************** */
  /** ******************************************* HOOKS SECTION START *************************************************** */

  /**
   * Handles when GeoChart must be loaded with new inputs.
   * @param e PayloadChartLoad The event payload with the inputs to load
   */
  const handleChartLoad = useCallback<(e: PayloadChartLoad) => void>((e: PayloadChartLoad): void => {
    // Redirect
    setChart(e.inputs);
  }, []);

  /**
   * Handles when a query is started in GeoView Core.
   * @param e PayloadBaseClass The event payload determining the query that's happened
   */
  const handleQueryStarted = useCallback<(e: PayloadBaseClass) => void>((e: PayloadBaseClass): void => {
    // Verify the payload
    if (payloadIsQueryLayerQueryTypeAtLongLat(e)) {
      // Loading
      setIsLoadingChart(true);
    }
  }, []);

  /**
   * Handles when the GeoChart Datasource is changed. This is helpful for the lazy loading of the charts.
   * @param ds GeoChartDatasource The Datasource that was selected (or none).
   */
  const handleDatasourceChanged = useCallback<(ds: GeoChartDatasource | undefined) => void>(
    async (ds: GeoChartDatasource | undefined) => {
      // If a Datasource is selected and has no items
      if (configChartLayer && ds && !ds!.items) {
        // Fetch datasource items and set the selected datasource
        await setDatasourceByFetchingItems(configChartLayer, ds);
      }
    },
    [configChartLayer]
  );

  /**
   * Fetches the datasources given the updated list of results.
   * @param layerDataArray TypeArrayOfLayerData The array of layer data results from the store.
   */
  const fetchDatasources = useCallback<(layerDataArray: TypeArrayOfLayerData) => Promise<void>>(
    async (layerDataArray: TypeArrayOfLayerData): Promise<void> => {
      try {
        // Find the right config/layer/data for what we want based on the layerDataArray
        const [foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData]: [
          GeoViewGeoChartConfig<ChartType> | undefined,
          GeoViewGeoChartConfigLayer | undefined,
          TypeLayerEntryConfig | undefined,
          TypeFeatureInfoEntry[] | undefined
        ] = findLayerDataAndConfigFromQueryResults(config, cgpv.api.maps[mapId].layer.registeredLayers, layerDataArray);

        // If found a chart for the layer
        if (foundData) {
          // Set the config chart layer
          setConfigChartLayer(foundConfigChartLyr!);

          // Check and attach datasources to the Chart config
          const chartConfig = await checkForDatasources(foundConfigChart!, foundConfigChartLyr!, foundData!);

          // Set the title
          chartConfig.title = foundLayerEntry.layerName![i18n.language];

          // Load the chart
          setChart(chartConfig);

          // If lazy loading and at least 1 datasource
          if (foundConfigChartLyr?.query?.lazyLoading && chartConfig.datasources.length > 0) {
            // Fetch the first datasource result off the bat
            await setDatasourceByFetchingItems(foundConfigChartLyr!, chartConfig.datasources[0]);
          }
        }
      } finally {
        // Loading
        setIsLoadingChart(false);
      }
    },
    [cgpv.api.maps, config, i18n.language, mapId]
  );

  /**
   * Temporary handle to help debugging. Will get removed when the bypass for eslint console.log() gets lifted
   * @param chart ChartType The chart type result
   * @param options ChartOptions<ChartType> The chart options parsed results
   * @param data ChartData<ChartType, GeoDefaultDataPoint<ChartType>> The chart data parsed results
   */
  const handleParsed = useCallback<
    (chart: ChartType, options: ChartOptions<ChartType>, data: ChartData<ChartType, GeoDefaultDataPoint<ChartType>>) => void
  >(
    (chart: ChartType, options: ChartOptions<ChartType>, data: ChartData<ChartType, GeoDefaultDataPoint<ChartType>>) => {
      console.log(`${t('Parsed to ChartJS')}: `, chart, options, data);
    },
    [t]
  );

  /**
   * Handles when an error happened with GeoChart.
   * @param validators (ValidatorResult | undefined)[] The validator results which produced the error.
   */
  const handleError = useCallback<(validators: (ValidatorResult | undefined)[]) => void>(
    (validators: (ValidatorResult | undefined)[]): void => {
      // Gather all error messages
      const msgAll = SchemaValidator.parseValidatorResultsMessages(validators);

      // Show errors
      if (msgAll.length > 0) cgpv.api.utilities.showError(mapId, msgAll);
    },
    [cgpv.api.utilities, mapId]
  );

  // Effect hook when the storeLayerDataArray changes - coming from the store.
  useEffect(() => {
    console.log('USE EFFECT storeLayerDataArray', storeLayerDataArray);
    // Fetches the datasources associated with the layerDataArray coming from the store - reloading the Chart in the process
    fetchDatasources(storeLayerDataArray);
  }, [fetchDatasources, storeLayerDataArray]);

  // Effect hook to add and remove event listeners
  useEffect(() => {
    // Wire handlers on component mount
    cgpv.api.event.on(EVENT_CHART_CONFIG, handleChartConfig, mapId);
    cgpv.api.event.on(EVENT_CHART_LOAD, handleChartLoad, mapId);
    cgpv.api.event.on(EVENT_CHART_REDRAW, handleChartRedraw, mapId);
    cgpv.api.event.on(cgpv.api.eventNames.GET_FEATURE_INFO.QUERY_LAYER, handleQueryStarted, `${mapId}`);

    return () => {
      // Unwire handlers on component unmount
      // TODO: Refactor - The store should say when the query has started (state). An issue is being created for this already. For now, this works.
      cgpv.api.event.off(cgpv.api.eventNames.GET_FEATURE_INFO.QUERY_LAYER, `${mapId}`, handleQueryStarted);
      cgpv.api.event.off(EVENT_CHART_REDRAW, mapId, handleChartRedraw);
      cgpv.api.event.off(EVENT_CHART_LOAD, mapId, handleChartLoad);
      cgpv.api.event.off(EVENT_CHART_CONFIG, mapId, handleChartConfig);
    };
  }, [cgpv.api.event, cgpv.api.eventNames.GET_FEATURE_INFO.QUERY_LAYER, handleChartLoad, handleQueryStarted, mapId]);

  /** ********************************************* HOOKS SECTION END *************************************************** */
  /** ******************************************** RENDER SECTION START ************************************************* */

  return (
    <Box>
      <GeoChartComponent
        sx={{ backgroundColor: defaultColors.backgroundColor }}
        inputs={inputs}
        datasource={selectedDatasource}
        schemaValidator={schemaValidator}
        defaultColors={defaultColors}
        isLoadingChart={isLoadingChart}
        isLoadingDatasource={isLoadingDatasource}
        action={action}
        onParsed={handleParsed}
        onDatasourceChanged={handleDatasourceChanged}
        onError={handleError}
      />
    </Box>
  );
}
