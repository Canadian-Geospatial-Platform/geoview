import type { GeoChartConfig, ChartType, GeoChartDefaultColors, SchemaValidator, GeoChartAction } from 'geochart';
import { GeoChart as GeoChartComponent } from 'geochart';
import {
  useAppDisplayLanguageById,
  useAppStoreActions,
  useDisplayDateTimezone,
} from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { useLayerDisplayDateFormatShort } from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeGeochartResultSetEntry } from 'geoview-core/core/stores/store-interface-and-intial-values/geochart-state';
import { MapEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/map-event-processor';
import type { TypeWindow } from 'geoview-core/core/types/global-types';
import type { TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import { logger } from 'geoview-core/core/utils/logger';
import type { ConfigBaseClass } from 'geoview-core/api/config/validation-classes/config-base-class';
import { GeoChartParsing } from './geochart-parsing';
import type { PluginGeoChartConfig, GeoViewGeoChartConfig, GeoViewGeoChartConfigLayer } from './geochart-types';

/**
 * Essential properties for the GeoChart.
 */
interface GeoChartProps {
  mapId: string;
  layerPath: string;
  config: PluginGeoChartConfig;
  schemaValidator: SchemaValidator;
  layers: TypeGeochartResultSetEntry[];

  sx?: React.CSSProperties;

  provideCallbackRedraw?: (callbackRedraw: () => void) => void;
}

/**
 * The main React JSX Element which listens to events and updates the GeoChart ui.
 *
 * @param props - Essential properties for the GeoChart
 * @returns The Geochart JSX
 */
export function GeoChart(props: GeoChartProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-geochart/geochart');

  // Get cgpv
  const { cgpv } = window as TypeWindow;
  const { useTheme } = cgpv.ui;
  const { useState, useCallback, useMemo } = cgpv.reactUtilities.react;

  // Read props
  const { mapId, layerPath, config, layers, schemaValidator, sx, provideCallbackRedraw } = props;

  // Get the theme
  const theme = useTheme();

  // Use State
  const [inputs, setInputs] = useState<GeoChartConfig<ChartType>>();
  const [action, setAction] = useState<GeoChartAction>();

  // Use Store
  const displayLanguage = useAppDisplayLanguageById(mapId);
  const displayDateFormatShort = useLayerDisplayDateFormatShort(layerPath);
  const displayDateTimezone = useDisplayDateTimezone();
  const { addNotification } = useAppStoreActions();

  // Provide the callback to redraw this component to the parent component
  provideCallbackRedraw?.(() => {
    // Force a redraw
    setAction({ shouldRedraw: true });
  });

  // #region CORE FUNCTIONS *******************************************************************************************

  /**
   * Loads the chart with new inputs.
   *
   * @param newInputs - Optional new inputs to load in the chart
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
   *
   * @param error - The error message
   * @param exception - Optional exception if any
   */
  const handleError = useCallback<(error: string, exception: unknown | undefined) => void>(
    (errorMessage: string): void => {
      // Show error
      addNotification({ key: 'geochart', message: errorMessage, notificationType: 'error', count: 0 });
    },
    [addNotification]
  );

  /**
   * Memoizes the theme colors.
   */
  const memoDefaultColors: GeoChartDefaultColors = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOVIEW-GEOCHART - memoDefaultColors', theme);

    return {
      backgroundColor: theme.palette.background.default,
      borderColor: theme.palette.geoViewColor.grey.light[100],
      color: theme.palette.geoViewColor.textColor.main,
    };
  }, [theme]);

  /**
   * Memoizes the fetching of the correct config based on the provided layers array.
   */
  const memoAllInfo = useMemo(() => {
    // Find the right config/layer/data for what we want based on the layerDataArray
    const [foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData]: [
      GeoViewGeoChartConfig | undefined,
      GeoViewGeoChartConfigLayer | undefined,
      ConfigBaseClass | undefined,
      TypeFeatureInfoEntry[] | undefined,
    ] = GeoChartParsing.findLayerDataAndConfigFromQueryResults(config, layers, (lyrPath: string) => {
      // Searches the layer entry config based on the layer path using the MapEventProcessor
      return MapEventProcessor.getLayerEntryConfigIfExists(mapId, lyrPath);
    });

    // If found a chart for the layer
    let chartConfig;
    if (foundData && foundLayerEntry) {
      // Check and attach datasources to the Chart config
      chartConfig = GeoChartParsing.loadDatasources(foundConfigChart!, foundConfigChartLyr!, foundData);

      // Set the title only if a title isn't already set
      chartConfig.title ??= foundLayerEntry.getLayerName();

      // Assign the date format and time IANA if none are set by the config itself
      chartConfig.geochart.xAxis.timeFormat ??= GeoChartParsing.dayjsToLuxonFormat(displayDateFormatShort[displayLanguage]);
      chartConfig.geochart.xAxis.timeIANA ??= GeoChartParsing.dayjsToLuxonTimeIANA(displayDateTimezone);
    }

    // Return all info
    return { foundConfigChart, foundConfigChartLyr, foundLayerEntry, foundData, chartConfig };
  }, [config, mapId, layers, displayLanguage, displayDateFormatShort, displayDateTimezone]);

  // #endregion

  // #region PROCESSING ***********************************************************************************************

  if (memoAllInfo.chartConfig && memoAllInfo.chartConfig !== inputs) {
    setChart(memoAllInfo.chartConfig);
  }

  // #endregion

  // #region RENDER SECTION *******************************************************************************************

  return (
    <GeoChartComponent
      chart="line"
      schemaValidator={schemaValidator}
      sx={{ ...sx, ...{ backgroundColor: memoDefaultColors.backgroundColor } }}
      inputs={inputs}
      language={displayLanguage}
      defaultColors={memoDefaultColors}
      action={action}
      onError={handleError}
    />
  );

  // #endregion
}
