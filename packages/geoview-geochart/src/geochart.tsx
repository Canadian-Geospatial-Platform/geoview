import { TypeWindow, TypeLayerEntryConfig, useAppDisplayLanguageById } from 'geoview-core';
import { GeoChart as GeoChartComponent, GeoChartConfig, ChartType, GeoChartDefaultColors, SchemaValidator, GeoChartAction } from 'geochart';
import { TypeArrayOfLayerData, TypeFeatureInfoEntry } from 'geoview-core/src/api/events/payloads';
import { logger } from 'geoview-core/src/core/utils/logger';
import { findLayerDataAndConfigFromQueryResults, loadDatasources } from './geochart-parsing';
import { PluginGeoChartConfig, GeoViewGeoChartConfig, GeoViewGeoChartConfigLayer } from './geochart-types';

/**
 * Essential properties for the GeoChart
 */
interface GeoChartProps {
  mapId: string;
  config: PluginGeoChartConfig<ChartType>;
  schemaValidator: SchemaValidator;
  layers: TypeArrayOfLayerData;
  // eslint-disable-next-line react/require-default-props
  sx?: React.CSSProperties;
  // eslint-disable-next-line react/require-default-props
  provideCallbackRedraw?: (callbackRedraw: () => void) => void;
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
  const { useState, useCallback, useMemo } = cgpv.react;

  // Read props
  const { mapId, config, layers, schemaValidator, sx, provideCallbackRedraw } = props;

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
  const [inputs, setInputs] = useState<GeoChartConfig<ChartType>>();
  const [action, setAction] = useState<GeoChartAction>();

  // Use Store
  const displayLanguage = useAppDisplayLanguageById(mapId);

  // #endregion

  // Provide the callback to redraw this component to the parent component
  provideCallbackRedraw?.(() => {
    // Force a redraw
    setAction({ shouldRedraw: true });
  });

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

  // #region HOOKS SECTION ********************************************************************************************

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

  /**
   * Memoizes the fetching of the correct config based on the provided layers array (TypeArrayOfLayerData).
   */
  const memoAllInfo = useMemo(() => {
    // Find the right config/layer/data for what we want based on the layerDataArray
    const [foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData]: [
      GeoViewGeoChartConfig<ChartType> | undefined,
      GeoViewGeoChartConfigLayer | undefined,
      TypeLayerEntryConfig | undefined,
      TypeFeatureInfoEntry[] | undefined
    ] = findLayerDataAndConfigFromQueryResults(config, cgpv.api.maps[mapId].layer.registeredLayers, layers);

    // If found a chart for the layer
    let chartConfig;
    if (foundData) {
      // Check and attach datasources to the Chart config
      chartConfig = loadDatasources(foundConfigChart!, foundConfigChartLyr!, foundData!);

      // Set the title
      chartConfig.title = foundLayerEntry.layerName![displayLanguage];
    }

    // Return all info
    return { foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData, chartConfig };
  }, [cgpv.api.maps, config, displayLanguage, mapId, layers]);

  // #endregion

  // #region PROCESSING ***********************************************************************************************

  if (memoAllInfo.chartConfig && memoAllInfo.chartConfig !== inputs) {
    setChart(memoAllInfo.chartConfig);
  }

  // #endregion

  // #region RENDER SECTION *******************************************************************************************

  return (
    <GeoChartComponent
      schemaValidator={schemaValidator}
      sx={{ ...sx, ...{ backgroundColor: defaultColors.backgroundColor } }}
      inputs={inputs}
      language={displayLanguage}
      defaultColors={defaultColors}
      action={action}
      onError={handleError}
    />
  );

  // #endregion
}
