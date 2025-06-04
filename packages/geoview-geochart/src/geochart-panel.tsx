import { TypeWindow } from 'geoview-core/src/core/types/global-types';
import { ChartType, SchemaValidator } from 'geochart';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { checkSelectedLayerPathList } from 'geoview-core/src/core/components/common/comp-common';
import { Typography } from 'geoview-core/src/ui/typography/typography';
import { Box } from 'geoview-core/src/ui';
import { useMapClickCoordinates, useMapVisibleLayers } from 'geoview-core/src/core/stores/store-interface-and-intial-values/map-state';
import {
  useGeochartConfigs,
  useGeochartStoreActions,
  useGeochartLayerDataArrayBatch,
  useGeochartSelectedLayerPath,
  TypeGeochartResultSetEntry,
} from 'geoview-core/src/core/stores/store-interface-and-intial-values/geochart-state';
import { useAppDisplayLanguage } from 'geoview-core/src/core/stores/store-interface-and-intial-values/app-state';
import { getLocalizedMessage } from 'geoview-core/src/core/utils/utilities';
import { logger } from 'geoview-core/src/core/utils/logger';
import { TABS } from 'geoview-core/src/core/utils/constant';

import { GeoChart } from './geochart';
import { GeoViewGeoChartConfig } from './geochart-types';

interface GeoChartPanelProps {
  mapId: string;
  // eslint-disable-next-line react/require-default-props
  provideCallbackRedraw?: (callbackRedraw: () => void) => void;
}

/**
 * Geo Chart Panel with Layers on the left and Charts on the right
 *
 * @param {GeoChartPanelProps} props The properties passed to geo chart
 * @returns {JSX.Element} Geo Chart tab
 */
export function GeoChartPanel(props: GeoChartPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-geochart/geochart-panel');

  const { cgpv } = window as TypeWindow;
  const { mapId, provideCallbackRedraw } = props;
  const { react } = cgpv;
  const { useState, useCallback, useMemo, useEffect, useRef } = react;

  // Get states and actions from store
  const configObj = useGeochartConfigs();
  const visibleLayers = useMapVisibleLayers() as string[];
  const storeArrayOfLayerData = useGeochartLayerDataArrayBatch() as TypeGeochartResultSetEntry[];
  const selectedLayerPath = useGeochartSelectedLayerPath() as string;
  const { setSelectedLayerPath, setLayerDataArrayBatchLayerPathBypass } = useGeochartStoreActions();
  const displayLanguage = useAppDisplayLanguage();
  const mapClickCoordinates = useMapClickCoordinates();

  // Create the validator shared for all the charts in the footer
  const [schemaValidator] = useState<SchemaValidator>(new SchemaValidator());

  // Keep a reference to the redraw callbacks for each GeoChart child components
  const redrawGeochart = useRef<Record<string, () => void>>({});

  /**
   * Redraws the GeoCharts in the Panel
   */
  const redrawGeoCharts = (): void => {
    // We need to redraw when the canvas isn't 'showing' in the DOM and when the user resizes the canvas placeholder.
    Object.entries(redrawGeochart.current).forEach(([, callback]) => {
      // Redraw
      callback();
    });
  };

  // Provide the callback to redraw the GeoCharts in the Panel to the Parent component
  provideCallbackRedraw?.(() => {
    // Redraw the GeoCharts
    redrawGeoCharts();
  });

  /**
   * Handles a click on the guide opening button click.
   */
  const handleGuideIsOpen = useCallback(
    (guideIsOpenVal: boolean): void => {
      // Log
      logger.logTraceUseCallback('GEOCHART PANEL - handleGuideIsOpen', guideIsOpenVal);
      if (guideIsOpenVal) {
        setSelectedLayerPath('');
      }
    },
    [setSelectedLayerPath]
  );

  /**
   * Handles click on enlarge button in the layout component.
   *
   * @param {boolean} isEnlarge Indicates if is enlarged
   */
  const handleIsEnlargeClicked = useCallback((isEnlarge: boolean) => {
    // Log
    logger.logTraceUseCallback('GEOCHART-PANEL - handleIsEnlargeClicked', isEnlarge);

    // Redraw the GeoCharts
    redrawGeoCharts();
  }, []);

  /**
   * Handles when the GeoChart child component is providing its callback to redraw itself
   * @param {string} key - The GeoChart unique key of the child component
   * @param {Function} theCallbackRedraw - The callback to execute whenever we want to redraw the GeoChart
   */
  const handleProvideCallbackRedraw = (key: string, theCallbackRedraw: () => void): void => {
    // Keep the callback
    redrawGeochart.current[key] = theCallbackRedraw;
  };

  // #region HOOKS

  /**
   * Gets the label for the number of features of a layer.
   * @returns string
   */
  const getNumFeaturesLabel = useCallback(
    (layer: TypeGeochartResultSetEntry): string => {
      // Log
      logger.logTraceUseCallback('GEOCHART-PANEL - getNumFeaturesLabel');

      const numOfFeatures = layer.features?.length ?? 0;
      return `${numOfFeatures} ${getLocalizedMessage(displayLanguage, 'geochart.panel.chart')}${numOfFeatures > 1 ? 's' : ''}`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapId]
  );

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer - The data of the selected layer
   */
  const handleLayerChange = useCallback(
    (layer: LayerListEntry): void => {
      // Log
      logger.logTraceUseCallback('GEOCHART-PANEL - handleLayerChange', layer);

      // Set the selected layer path in the store which will in turn trigger the store listeners on this component
      setSelectedLayerPath(layer.layerPath);
    },
    [setSelectedLayerPath]
  );

  // Reacts when the array of layer data updates
  const memoLayersList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOCHART-PANEL - memoLayersList', storeArrayOfLayerData);

    // Set the layers list
    return visibleLayers
      .map((layerPath) => storeArrayOfLayerData.find((layerData) => layerData.layerPath === layerPath))
      .filter((layer) => layer && configObj[layer.layerPath])
      .map(
        (layer) =>
          ({
            layerName: layer!.layerName ?? '',
            layerPath: layer!.layerPath,
            layerStatus: layer!.layerStatus,
            queryStatus: layer!.queryStatus,
            numOffeatures: layer!.features?.length ?? 0,
            layerFeatures: getNumFeaturesLabel(layer!),
            tooltip: `${layer!.layerName}, ${getNumFeaturesLabel(layer!)}`,
            layerUniqueId: `${mapId}-${TABS.GEO_CHART}-${layer.layerPath}`,
          }) as LayerListEntry
      );
  }, [visibleLayers, storeArrayOfLayerData, configObj, getNumFeaturesLabel, mapId]);

  /**
   * Memoizes the selected layer for the LayerList component.
   */
  const memoLayerSelectedItem = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOCHART-PANEL - memoLayerSelectedItem', memoLayersList, selectedLayerPath);
    return memoLayersList.find((layer) => layer.layerPath === selectedLayerPath);
  }, [memoLayersList, selectedLayerPath]);

  /**
   * Effect used to persist the layer path bypass for the layerDataArray.
   * A useEffect is necessary in order to keep this component pure and be able to set the layer path bypass elsewhere than in this component.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOCHART-PANEL - update layer data bypass', selectedLayerPath);

    // Set the layer data array batch bypass to the currently selected layer
    setLayerDataArrayBatchLayerPathBypass(selectedLayerPath);
  }, [selectedLayerPath, setLayerDataArrayBatchLayerPathBypass]);

  /**
   * Effect used to persist or alter the current layer selection based on the layers list changes.
   * A useEffect is necessary in order to keep this component pure and be able to set the selected layer path elsewhere than in this component.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOCHART-PANEL - check selection', memoLayerSelectedItem, selectedLayerPath);

    // If selected layer path is not empty launch the checker to try to maintain the selection on the correct selected layer
    if (selectedLayerPath) {
      // Redirect to the keep selected layer path logic
      checkSelectedLayerPathList(setLayerDataArrayBatchLayerPathBypass, setSelectedLayerPath, memoLayerSelectedItem, memoLayersList);
    }
  }, [memoLayerSelectedItem, memoLayersList, selectedLayerPath, setLayerDataArrayBatchLayerPathBypass, setSelectedLayerPath]);

  /**
   * Select a layer after a map click happened on the map.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL- mapClickCoordinates', mapClickCoordinates);

    // If nothing was previously selected at all
    if (mapClickCoordinates && memoLayersList?.length && !selectedLayerPath.length) {
      const selectedLayer = memoLayersList.find((layer) => !!layer.numOffeatures);
      // Select the first layer that has features
      setSelectedLayerPath(selectedLayer?.layerPath ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapClickCoordinates, memoLayersList, setSelectedLayerPath]);

  // #endregion HOOKS

  // #region RENDERING

  /**
   * Renders a single GeoChart component
   * @param {PluginGeoChartConfig<ChartType>} chartConfig - The Chart Config to assign the the GeoChart
   * @param {CSSProperties} sx - Styling to apply (basically if the GeoChart should be visible or not depending on the selected layer)
   * @returns {JSX.Element}
   */
  const renderChart = (chartConfig: GeoViewGeoChartConfig<ChartType>, sx: React.CSSProperties, key: string): JSX.Element => {
    return (
      <GeoChart
        sx={sx}
        key={key}
        mapId={mapId}
        config={{ charts: [chartConfig] }}
        layers={storeArrayOfLayerData}
        schemaValidator={schemaValidator}
        provideCallbackRedraw={(theCallbackRedraw) => handleProvideCallbackRedraw(key, theCallbackRedraw)}
      />
    );
  };

  /**
   * Renders the complete GeoChart Panel component
   * @returns {JSX.Element}
   */
  const renderComplete = (): JSX.Element => {
    if (memoLayersList) {
      return (
        <Layout
          selectedLayerPath={selectedLayerPath || ''}
          layerList={memoLayersList}
          onLayerListClicked={handleLayerChange}
          onIsEnlargeClicked={handleIsEnlargeClicked}
          onGuideIsOpen={handleGuideIsOpen}
          guideContentIds={['chart', 'chart.children.chartTypes']}
        >
          {selectedLayerPath && (
            <Box sx={{ '& .MuiButtonGroup-groupedHorizontal.MuiButton-textSizeMedium': { fontSize: '0.9rem' } }}>
              {Object.entries(configObj).map(([layerPath, layerChartConfig]) => {
                if (layerPath === selectedLayerPath) {
                  return renderChart(layerChartConfig as GeoViewGeoChartConfig<ChartType>, {}, layerPath);
                }
                return <Box key={layerPath} />;
              })}
            </Box>
          )}
        </Layout>
      );
    }

    // Loading UI
    return <Typography>{getLocalizedMessage(displayLanguage, 'geochart.panel.loadingUI')}</Typography>;
  };

  // Render
  return renderComplete();

  // #endregion
}
