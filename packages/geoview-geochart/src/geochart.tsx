import { TypeWindow, TypeLayerEntryConfig, useAppDisplayLanguageById } from 'geoview-core';
import { useDetailsStoreLayerDataArray } from 'geoview-core/src/core/stores/store-interface-and-intial-values/details-state';
import { GeoChart as GeoChartComponent, GeoChartConfig, ChartType, GeoChartDefaultColors, SchemaValidator, GeoChartAction } from 'geochart';
import {
  PayloadBaseClass,
  payloadIsQueryLayerQueryTypeAtLongLat,
  TypeArrayOfLayerData,
  TypeFeatureInfoEntry,
} from 'geoview-core/src/api/events/payloads';
import { logger } from 'geoview-core/src/core/utils/logger';
import { findLayerDataAndConfigFromQueryResults, loadDatasources } from './geochart-parsing';
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
  // eslint-disable-next-line react/require-default-props
  sx?: React.CSSProperties;
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
  const { useTheme } = cgpv.ui;
  const { useEffect, useState, useCallback } = cgpv.react;

  // Read props
  const { mapId, config: parentConfig, schemaValidator, sx } = props;

  // Get the theme
  const theme = useTheme();

  // Tweak the default colors based on the theme
  const defaultColors: GeoChartDefaultColors = {
    backgroundColor: theme.palette.background.default,
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
  };

  // #region USE STATE SECTION ****************************************************************************************

  // Use State
  const [config, setConfig] = useState<PluginGeoChartConfig<ChartType>>(parentConfig);
  const [inputs, setInputs] = useState<GeoChartConfig<ChartType>>();
  const [action, setAction] = useState<GeoChartAction>();
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>();

  // Use Store
  const storeLayerDataArray = useDetailsStoreLayerDataArray();
  const displayLanguage = useAppDisplayLanguageById(mapId);

  // #endregion

  // #region CORE FUNCTIONS *******************************************************************************************

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

  // #endregion

  // # region EVENT HANDLERS SECTION **********************************************************************************

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

  // #endregion

  // #region HOOKS SECTION ********************************************************************************************

  /**
   * Handles when GeoChart must be loaded with new inputs.
   * @param e PayloadChartLoad The event payload with the inputs to load
   */
  const handleChartLoad = useCallback<(e: PayloadChartLoad) => void>((e: PayloadChartLoad): void => {
    // Log
    logger.logTraceUseCallback('GEOVIEW-GEOCHART - handleChartLoad', e);

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
      // Log
      logger.logTraceUseCallback('GEOVIEW-GEOCHART - handleQueryStarted', e);

      // Loading
      setIsLoadingChart(true);
    }
  }, []);

  /**
   * Fetches the datasources given the updated list of results.
   * @param layerDataArray TypeArrayOfLayerData The array of layer data results from the store.
   */
  const fetchDatasources = useCallback<(layerDataArray: TypeArrayOfLayerData) => void>(
    (layerDataArray: TypeArrayOfLayerData): void => {
      // Log
      logger.logTraceUseCallback('GEOVIEW-GEOCHART - fetchDatasources', mapId, layerDataArray);

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
          // Check and attach datasources to the Chart config
          const chartConfig = loadDatasources(foundConfigChart!, foundConfigChartLyr!, foundData!);

          // Set the title
          chartConfig.title = foundLayerEntry.layerName![displayLanguage];

          // Load the chart
          setChart(chartConfig);
        }
      } finally {
        // Loading
        setIsLoadingChart(false);
      }
    },
    [cgpv.api.maps, config, displayLanguage, mapId]
  );

  /**
   * Handles when an error happened with GeoChart.
   * @param error string The error.
   * @param exception unknown The exception if any
   */
  const handleError = useCallback<(error: string, exception: unknown | undefined) => void>(
    (error: string): void => {
      // Log
      logger.logTraceUseCallback('GEOVIEW-GEOCHART - handleError', mapId, error);

      // Show error
      cgpv.api.utilities.showError(mapId, error);
    },
    [cgpv.api.utilities, mapId]
  );

  // Effect hook when the storeLayerDataArray changes - coming from the store.
  useEffect(() => {
    // Log
    const USE_EFFECT_FUNC = 'GEOVIEW-GEOCHART - storeLayerDataArray';
    logger.logTraceUseEffect(USE_EFFECT_FUNC, storeLayerDataArray);

    // Fetches the datasources associated with the layerDataArray coming from the store - reloading the Chart in the process
    fetchDatasources(storeLayerDataArray);

    return () => {
      // Log
      logger.logTraceUseEffectUnmount(USE_EFFECT_FUNC, storeLayerDataArray);
    };
  }, [fetchDatasources, storeLayerDataArray]);

  // Effect hook to add and remove event listeners
  useEffect(() => {
    // Log
    const USE_EFFECT_FUNC = 'GEOVIEW-GEOCHART - init';
    logger.logTraceUseEffect(USE_EFFECT_FUNC, mapId);

    // Wire handlers on component mount
    cgpv.api.event.on(EVENT_CHART_CONFIG, handleChartConfig, mapId);
    cgpv.api.event.on(EVENT_CHART_LOAD, handleChartLoad, mapId);
    cgpv.api.event.on(EVENT_CHART_REDRAW, handleChartRedraw, mapId);
    cgpv.api.event.on(cgpv.api.eventNames.GET_FEATURE_INFO.QUERY_LAYER, handleQueryStarted, `${mapId}`);

    return () => {
      // Log
      logger.logTraceUseEffectUnmount(USE_EFFECT_FUNC, mapId);

      // Unwire handlers on component unmount
      // TODO: Refactor - The store should have a 'loading features clicked state (with abortion mechanisms)'. An issue is being created for this already. For now, this works.
      cgpv.api.event.off(cgpv.api.eventNames.GET_FEATURE_INFO.QUERY_LAYER, `${mapId}`, handleQueryStarted);
      cgpv.api.event.off(EVENT_CHART_REDRAW, mapId, handleChartRedraw);
      cgpv.api.event.off(EVENT_CHART_LOAD, mapId, handleChartLoad);
      cgpv.api.event.off(EVENT_CHART_CONFIG, mapId, handleChartConfig);
    };
  }, [cgpv.api.event, cgpv.api.eventNames.GET_FEATURE_INFO.QUERY_LAYER, handleChartLoad, handleQueryStarted, mapId]);

  // #endregion

  // region RENDER SECTION ********************************************************************************************

  return (
    <GeoChartComponent
      schemaValidator={schemaValidator}
      sx={{ ...sx, ...{ backgroundColor: defaultColors.backgroundColor } }}
      inputs={inputs}
      language={displayLanguage}
      defaultColors={defaultColors}
      isLoadingChart={isLoadingChart}
      action={action}
      onError={handleError}
    />
  );

  // #endregion
}
