import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { TypeWindow } from 'geoview-core';
import { ChartType, SchemaValidator } from 'geochart';
import { LayerListEntry, Layout } from 'geoview-core/src/core/components/common';
import { TypeArrayOfLayerData, TypeLayerData } from 'geoview-core/src/api/events/payloads';
import { Typography } from 'geoview-core/src/ui/typography/typography';
import { Paper } from 'geoview-core/src/ui';
import { logger } from 'geoview-core/src/core/utils/logger';
import { useMapVisibleLayers } from 'geoview-core/src/core/stores/store-interface-and-intial-values/map-state';
import { useDetailsStoreLayerDataArray } from 'geoview-core/src/core/stores';
import { useGeochartConfigs } from 'geoview-core/src/core/stores/store-interface-and-intial-values/geochart-state';

import { GeoChart } from './geochart';
import { GeoViewGeoChartConfig } from './geochart-types';
import { getSxClasses } from './geochart-style';

type GeoChartRenders = {
  [layerPath: string]: boolean;
};

interface GeoChartPanelProps {
  mapId: string;
}

/**
 * Geo Chart tab
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
  const { useState, useCallback, useEffect, useRef } = react;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Prepare the states
  const [selectedLayerPath, setSelectedLayerPath] = useState<string>('');
  const [geoChartLayersList, setGeoChartLayersList] = useState<LayerListEntry[]>([]);

  // get store geochart info
  const configObj = useGeochartConfigs();
  const visibleLayers = useMapVisibleLayers() as string[];
  const arrayOfLayerData = useDetailsStoreLayerDataArray() as TypeArrayOfLayerData;

  // Create the validator shared for all the charts in the footer
  const [schemaValidator] = useState<SchemaValidator>(new SchemaValidator());

  // Lists the charts that were rendered at least once
  const chartFirstRenders = useRef({} as GeoChartRenders);

  /**
   * Get number of features of a layer.
   * @returns string
   */
  const getFeaturesOfLayer = useCallback(
    (layer: TypeLayerData): string => {
      const numOfFeatures = layer.features?.length ?? 0;
      return `${numOfFeatures} ${t('details.feature')}${numOfFeatures > 1 ? 's' : ''}`;
    },
    [t]
  );

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param {LayerListEntry} layer The data of the selected layer
   */
  const handleLayerChange = useCallback((layer: LayerListEntry): void => {
    // Log
    logger.logTraceUseCallback('GEOCHART-PANEL - layer', layer);

    // Set the selected layer path
    setSelectedLayerPath(layer.layerPath);
  }, []);

  /**
   * Handles click on enlarge button in the layout component.
   *
   * @param {LayerListEntry} layer The data of the selected layer
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

  // Reacts when the array of layer data updates
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOCHART-PANEL - ArrayOfLayerData', arrayOfLayerData);

    // Update the layers list information
    const layerListEntry: LayerListEntry[] = [];
    arrayOfLayerData.forEach((layer) => {
      // If the layer is visible and has a chart in the config
      if (visibleLayers.includes(layer.layerPath) && configObj[layer.layerPath]) {
        layerListEntry.push({
          layerName: layer.layerName ?? '',
          layerPath: layer.layerPath,
          numOffeatures: layer.features?.length ?? 0,
          layerFeatures: getFeaturesOfLayer(layer),
          tooltip: `${layer.layerName}, ${getFeaturesOfLayer(layer)}`,
        });
      }
    });

    // Set the list
    setGeoChartLayersList(layerListEntry);
  }, [arrayOfLayerData, configObj, getFeaturesOfLayer, visibleLayers]);

  // Reacts when the list of layers being officially listed changed
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOCHART-PANEL - GeoChartLayersList', geoChartLayersList, selectedLayerPath);

    // If there was a selected layer path already
    let changeSelectedLayerPath = false;
    let finalLayerPath = '';
    if (selectedLayerPath) {
      // Get the layer list entry for that layer path
      const geoChartLayerEntry = geoChartLayersList.find((geoChartLayer: LayerListEntry) => geoChartLayer.layerPath === selectedLayerPath);

      // If found
      if (geoChartLayerEntry) {
        // Check if there's nothing currently selected on that layer path
        if (!geoChartLayerEntry.numOffeatures) {
          changeSelectedLayerPath = true;
        } else {
          // There is something, stay on it.
          finalLayerPath = selectedLayerPath;
        }
      }
    } else {
      // Find another layer with features
      changeSelectedLayerPath = true;
    }

    // If changing
    if (changeSelectedLayerPath) {
      // Find another layer with features
      const anotherGeoChartLayerEntry = geoChartLayersList.find((geoChartLayer: LayerListEntry) => geoChartLayer.numOffeatures);
      // If found
      if (anotherGeoChartLayerEntry) {
        // Select that one
        setSelectedLayerPath(anotherGeoChartLayerEntry.layerPath);
        finalLayerPath = anotherGeoChartLayerEntry.layerPath;
      } else {
        // None found, select none
        setSelectedLayerPath('');
      }
    }

    // If it was the first rendering for that particular layer path
    if (!chartFirstRenders.current[finalLayerPath]) {
      // Rendered at least once
      chartFirstRenders.current[finalLayerPath] = true;

      // We need to redraw when the canvas isn't 'showing' in the DOM and when the user resizes the canvas placeholder.
      cgpv.api.maps[mapId].plugins.geochart.redrawChart();
    }
  }, [cgpv.api.maps, geoChartLayersList, mapId, selectedLayerPath]);

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
    if (geoChartLayersList) {
      if (geoChartLayersList.length > 0) {
        return (
          <Layout
            selectedLayerPath={selectedLayerPath}
            layerList={geoChartLayersList}
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
                <Typography variant="h3" gutterBottom sx={sxClasses.detailsInstructionsTitle}>
                  {t('geochart.chartPanel.noLayers')}
                </Typography>
                <Typography component="p" sx={sxClasses.detailsInstructionsBody}>
                  {t('geochart.chartPanel.noLayers')}
                </Typography>
              </Paper>
            )}
          </Layout>
        );
      }

      // No layers
      return <Typography>{t('chartPanel.panel.noLayers')}</Typography>;
    }

    // Loading UI
    return <Typography>{t('chartPanel.panel.loadingUI')}</Typography>;
    // return <CircularProgress isLoaded={false} />;
  };

  // Render
  return renderComplete();
}
