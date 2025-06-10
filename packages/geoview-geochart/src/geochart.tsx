import { GeoChart as GeoChartComponent, GeoChartConfig, ChartType, GeoChartDefaultColors, SchemaValidator, GeoChartAction } from 'geochart';
import { useAppDisplayLanguageById, useAppStoreActions } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { TypeGeochartResultSetEntry } from 'geoview-core/src/core/stores/store-interface-and-intial-values/geochart-state';
import { MapEventProcessor } from 'geoview-core/src/api/event-processors/event-processor-children/map-event-processor';
import { TypeWindow } from 'geoview-core/src/core/types/global-types';
import { TypeFeatureInfoEntry } from 'geoview-core/src/api/config/types/map-schema-types';
import { ConfigBaseClass } from 'geoview-core/src/core/utils/config/validation-classes/config-base-class';
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
  layers: TypeGeochartResultSetEntry[];
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
  const { addNotification } = useAppStoreActions();

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
      setInputs(newInputs);
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
    (errorMessage: string): void => {
      // Log
      logger.logTraceUseCallback('GEOVIEW-GEOCHART - handleError', mapId, errorMessage);

      // Show error
      addNotification({ key: 'geochart', message: errorMessage, notificationType: 'error', count: 0 });
    },
    [addNotification, mapId]
  );

  /**
   * Memoizes the fetching of the correct config based on the provided layers array (TypeArrayOfLayerData).
   */
  const memoAllInfo = useMemo(() => {
    // Find the right config/layer/data for what we want based on the layerDataArray
    const [foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData]: [
      GeoViewGeoChartConfig<ChartType> | undefined,
      GeoViewGeoChartConfigLayer | undefined,
      ConfigBaseClass | undefined,
      TypeFeatureInfoEntry[] | undefined,
    ] = findLayerDataAndConfigFromQueryResults(config, MapEventProcessor.getMapViewerLayerAPI(mapId), layers);

    // If found a chart for the layer
    let chartConfig;
    if (foundData && foundLayerEntry) {
      // Check and attach datasources to the Chart config
      chartConfig = loadDatasources(foundConfigChart!, foundConfigChartLyr!, foundData);

      // Set the title
      chartConfig.title = foundLayerEntry.layerName;
    }

    // Return all info
    return { foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData, chartConfig };
  }, [config, mapId, layers]);

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
