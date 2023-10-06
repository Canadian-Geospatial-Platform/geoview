import { TypeWindow, TypeLayerEntryConfig } from 'geoview-core';
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
} from 'geochart';
import { PayloadBaseClass, payloadIsAllQueriesDone, TypeFeatureInfoEntry } from 'geoview-core/src/api/events/payloads';
import { findLayerDataAndConfigFromQueryResults, checkAndAttachDatasources } from './geochart-parsing';
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
  const { useTheme } = cgpv.ui;
  const { Box } = cgpv.ui.elements;
  const { useEffect, useState } = cgpv.react;

  // Read props
  const { mapId, config: elConfig, schemaValidator } = props;

  // Get the theme
  const theme = useTheme();

  // Tweak the default colors based on the theme
  const defaultColors: GeoChartDefaultColors = {
    backgroundColor: theme.palette.background.default,
    borderColor: theme.palette.border.primary,
    color: theme.palette.primary.main,
  };

  // Use State
  const [config, setConfig] = useState<PluginGeoChartConfig<ChartType>>(elConfig);
  const [action, setAction] = useState<GeoChartAction>({});
  const [inputs, setInputs] = useState<GeoChartConfig<ChartType>>();

  const handleParsed = (chart: ChartType, options: ChartOptions<ChartType>, data: ChartData<ChartType, GeoDefaultDataPoint<ChartType>>) => {
    console.log('Parsed to ChartJS: ', chart, options, data);
  };

  const handleError = (
    inputErrors: ValidatorResult | undefined,
    optionsErrors: ValidatorResult | undefined,
    dataErrors: ValidatorResult | undefined
  ): void => {
    // Gather all error messages
    const msgs = [];
    if (inputErrors) msgs.push(inputErrors);
    if (optionsErrors) msgs.push(optionsErrors);
    if (dataErrors) msgs.push(dataErrors);
    const msgAll = SchemaValidator.parseValidatorResultsMessages(msgs);

    // Show errors
    if (msgAll.length > 0) cgpv.api.utilities.showError(mapId, msgAll);
  };

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

  /**
   * Handles when GeoChart must be loaded with new inputs.
   * @param e PayloadChartLoad The event payload with the inputs to load
   */
  const handleChartLoad = (e: PayloadChartLoad): void => {
    // Redirect
    setChart(e.inputs);
  };

  /**
   * Handles when a list of queries happened in GeoView Core.
   * @param e PayloadBaseClass The event payload with the resulsSet
   */
  const handleQueriesDone = async (e: PayloadBaseClass): Promise<void> => {
    if (payloadIsAllQueriesDone(e)) {
      // Find the right config/layer/data for what we want based on the resultsSet
      const [foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData]: [
        GeoViewGeoChartConfig<ChartType> | undefined,
        GeoViewGeoChartConfigLayer | undefined,
        TypeLayerEntryConfig | undefined,
        TypeFeatureInfoEntry[] | undefined
      ] = findLayerDataAndConfigFromQueryResults(config, cgpv.api.maps[mapId].layer.registeredLayers, e.resultSets);

      // If found a chart for the layer
      if (foundData) {
        // Check and attach datasources to the Chart config
        const chartConfig = await checkAndAttachDatasources(foundConfigChart!, foundConfigChartLyr!, foundData!);

        // Set the title
        chartConfig.title = foundLayerEntry.layerName!.en;

        // Load the chart
        setChart(chartConfig);
      }
    }

    // Empty
    return Promise.resolve();
  };

  // Effect hook to add and remove event listeners
  useEffect(() => {
    // TODO: Refactor: This cgpv.api stuff. Create a Store for GeoChart and reuse the GeoView store for ALL_QUERIES_DONE.
    // Wire handlers on component mount
    cgpv.api.event.on(EVENT_CHART_CONFIG, handleChartConfig, mapId);
    cgpv.api.event.on(EVENT_CHART_LOAD, handleChartLoad, mapId);
    cgpv.api.event.on(EVENT_CHART_REDRAW, handleChartRedraw, mapId);
    cgpv.api.event.on(cgpv.api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, handleQueriesDone, `${mapId}/FeatureInfoLayerSet`);

    return () => {
      // Unwire handlers on component unmount
      cgpv.api.event.off(cgpv.api.eventNames.GET_FEATURE_INFO.ALL_QUERIES_DONE, `${mapId}/FeatureInfoLayerSet`, handleQueriesDone);
      cgpv.api.event.off(EVENT_CHART_REDRAW, mapId, handleChartRedraw);
      cgpv.api.event.off(EVENT_CHART_LOAD, mapId, handleChartLoad);
      cgpv.api.event.off(EVENT_CHART_CONFIG, mapId, handleChartConfig);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, inputs]); // The config and inputs dependencies is important here. If we remove it, the 'config' constant used in 'handleQueriesDone' will use a value from a past render.

  return (
    <Box>
      <GeoChartComponent
        style={{ padding: 10, backgroundColor: defaultColors.backgroundColor }}
        inputs={inputs}
        schemaValidator={schemaValidator}
        defaultColors={defaultColors}
        action={action}
        onParsed={handleParsed}
        onError={handleError}
      />
    </Box>
  );
}
