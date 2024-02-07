import { useTheme } from '@mui/material/styles';
import { TypeWindow, getLocalizedMessage } from 'geoview-core';
import { ChartType, SchemaValidator } from 'geochart';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { TypeLayerData, TypeArrayOfLayerData } from 'geoview-core/src/api/events/payloads/get-feature-info-payload';
import { Typography } from 'geoview-core/src/ui/typography/typography';
import { Paper } from 'geoview-core/src/ui';
import {
  useMapVisibleLayers,
  useGeochartStoreActions,
  useGeochartStoreLayerDataArray,
  useGeochartStoreSelectedLayerPath,
} from 'geoview-core/src/core/stores';
import { useGeochartConfigs } from 'geoview-core/src/core/stores/store-interface-and-intial-values/geochart-state';
import { logger } from 'geoview-core/src/core/utils/logger';

import { GeoChart } from './geochart';
import { GeoViewGeoChartConfig } from './geochart-types';
import { getSxClasses } from './geochart-style';

interface GeoChartPanelProps {
  mapId: string;
}

/**
 * Geo Chart Panel with Layers on the left and Charts on the right
 *
 * @param {TypeTimeSliderProps} props The properties passed to geo chart
 * @returns {JSX.Element} Geo Chart tab
 */
export function GeoChartPanel(props: GeoChartPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('geochart/geochart-panel');

  const { cgpv } = window as TypeWindow;
  const { mapId } = props;
  const { react } = cgpv;
  const { useState, useCallback, useMemo, useEffect } = react;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Get states and actions from store
  const configObj = useGeochartConfigs();
  const visibleLayers = useMapVisibleLayers() as string[];
  const arrayOfLayerData = useGeochartStoreLayerDataArray() as TypeArrayOfLayerData;
  const selectedLayerPath = useGeochartStoreSelectedLayerPath() as string;
  const { setSelectedLayerPath, setLayerDataArrayBatchLayerPathBypass } = useGeochartStoreActions();

  // Prepare the internal states
  const [arrayOfLayerDataLocal, setArrayOfLayerDataLocal] = useState<LayerListEntry[]>([]);

  // Create the validator shared for all the charts in the footer
  const [schemaValidator] = useState<SchemaValidator>(new SchemaValidator());

  /**
   * Handles click on enlarge button in the layout component.
   *
   * @param {boolean} isEnlarge Indicates if is enlarged
   */
  const handleIsEnlargeClicked = useCallback(
    (isEnlarge: boolean) => {
      // Log
      logger.logTraceUseCallback('GEOCHART-PANEL - is enlarge', isEnlarge);

      // We need to redraw when the canvas isn't 'showing' in the DOM and when the user resizes the canvas placeholder.
      cgpv.api.maps[mapId].plugins.geochart.redrawChart();
    },
    [cgpv.api.maps, mapId]
  );

  /**
   * Get the label for the number of features of a layer.
   * @returns string
   */
  const getNumFeaturesLabel = useCallback(
    (layer: TypeLayerData): string => {
      // Log
      logger.logTraceUseCallback('GEOCHART-PANEL - getNumFeaturesLabel');

      const numOfFeatures = layer.features?.length ?? 0;
      return `${numOfFeatures} ${getLocalizedMessage(mapId, 'geochart.panel.chart')}${numOfFeatures > 1 ? 's' : ''}`;
    },
    [mapId]
  );

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = useCallback(
    (layer: LayerListEntry): void => {
      // Log
      logger.logTraceUseCallback('GEOCHART-PANEL - layer', layer);

      // Set the selected layer path in the store which will in turn trigger the store listeners on this component
      setSelectedLayerPath(layer.layerPath);
    },
    [setSelectedLayerPath]
  );

  // Reacts when the array of layer data updates
  const memoLayersList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOCHART-PANEL - ArrayOfLayerData', arrayOfLayerData);

    // Set the layers list
    return visibleLayers
      .map((layerPath) => arrayOfLayerData.find((layerData) => layerData.layerPath === layerPath))
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
          } as LayerListEntry)
      );
  }, [visibleLayers, arrayOfLayerData, configObj, getNumFeaturesLabel]);

  /**
   * Memoize the selected layer for the LayerList component.
   */
  const memoLayerSelectedItem = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOCHART-PANEL - memoLayerSelectedItem', memoLayersList, selectedLayerPath);
    return memoLayersList.find((layer) => layer.layerPath === selectedLayerPath);
  }, [memoLayersList, selectedLayerPath]);

  /**
   * Effect used to persist persist the layer path bypass for the layerDataArray.
   * A useEffect is necessary in order to keep this component pure and be able to set the layer path bypass elsewhere than in this component.
   */
  // TODO: This useEffect and the next one are the same in details-panel, create a custom hook for both?
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
    logger.logTraceUseEffect('GEOCHART-PANEL - check selection', memoLayerSelectedItem);

    // Check if the layer we are on is not 'processed' or 'error', ignore if so
    if (memoLayerSelectedItem && !(memoLayerSelectedItem.queryStatus === 'processed' || memoLayerSelectedItem.queryStatus === 'error'))
      return;

    // Check if the layer we are one still have features
    if (memoLayerSelectedItem?.numOffeatures) {
      // Log
      // logger.logDebug('GEOCHART-PANEL', 'keep selection');
      // All good, keep selection
      // Reset the bypass for next time
      setLayerDataArrayBatchLayerPathBypass(memoLayerSelectedItem.layerPath);
    } else {
      // Find the first layer with features
      const anotherLayerEntry = memoLayersList.find((layer) => {
        return memoLayersList.find((layer2) => layer.layerPath === layer2.layerPath && layer2.numOffeatures);
      });

      // If found
      if (anotherLayerEntry) {
        // Log
        // logger.logDebug('GEOCHART-PANEL', 'select another', anotherLayerEntry.layerPath);

        // Select that one
        setSelectedLayerPath(anotherLayerEntry.layerPath);
      } else {
        // Log
        // logger.logDebug('GEOCHART-PANEL', 'select none');

        // None found, select none
        setSelectedLayerPath('');
      }
    }
  }, [memoLayerSelectedItem, memoLayersList, setSelectedLayerPath, setLayerDataArrayBatchLayerPathBypass]);

  // If the array of layer data has changed since last render
  if (arrayOfLayerDataLocal !== memoLayersList) {
    // Selected array layer data changed
    setArrayOfLayerDataLocal(memoLayersList);
  }

  /**
   * Renders a single GeoChart component
   * @param chartConfig PluginGeoChartConfig<ChartType> the Chart Config to assign the the GeoChart
   * @param sx CSSProperties Styling to apply (basically if the GeoChart should be visible or not depending on the selected layer)
   * @returns JSX.Element
   */
  const renderChart = (chartConfig: GeoViewGeoChartConfig<ChartType>, sx: React.CSSProperties, key: string) => {
    return <GeoChart sx={sx} key={key} mapId={mapId} config={{ charts: [chartConfig] }} schemaValidator={schemaValidator} />;
  };

  /**
   * Renders the complete GeoChart Panel component
   * @returns JSX.Element
   */
  const renderComplete = () => {
    if (memoLayersList) {
      if (memoLayersList.length > 0) {
        return (
          <Layout
            selectedLayerPath={selectedLayerPath || ''}
            layerList={memoLayersList}
            handleLayerList={handleLayerChange}
            onIsEnlargeClicked={handleIsEnlargeClicked}
          >
            {selectedLayerPath &&
              Object.entries(configObj).map(([layerPath, layerChartConfig], index) => {
                const sx: React.CSSProperties = { position: 'absolute', top: '-5000px' };
                if (layerPath === selectedLayerPath) {
                  sx.top = '0px';
                }
                return renderChart(layerChartConfig as GeoViewGeoChartConfig<ChartType>, sx, index.toString());
              })}
            {!selectedLayerPath && (
              <Paper sx={{ padding: '2rem' }}>
                <Typography variant="h3" gutterBottom sx={sxClasses.geochartInstructionsTitle}>
                  {getLocalizedMessage(mapId, 'geochart.panel.clickMap')}
                </Typography>
                <Typography component="p" sx={sxClasses.geochartInstructionsBody}>
                  {getLocalizedMessage(mapId, 'geochart.panel.clickMap')}
                </Typography>
              </Paper>
            )}
          </Layout>
        );
      }

      // No layers
      return <Typography>{getLocalizedMessage(mapId, 'geochart.panel.noLayers')}</Typography>;
    }

    // Loading UI
    return <Typography>{getLocalizedMessage(mapId, 'geochart.panel.loadingUI')}</Typography>;
  };

  // Render
  return renderComplete();
}
