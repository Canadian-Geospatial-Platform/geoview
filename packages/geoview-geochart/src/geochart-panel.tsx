import type { TypeWindow } from 'geoview-core/core/types/global-types';
import { SchemaValidator } from 'geochart';
import type { LayerListEntry } from 'geoview-core/core/components/common';
import { Layout } from 'geoview-core/core/components/common';
import { checkSelectedLayerPathList } from 'geoview-core/core/components/common/comp-common';
import { Typography } from 'geoview-core/ui/typography/typography';
import { Box } from 'geoview-core/ui';
import { useStoreMapClickCoordinates } from 'geoview-core/core/stores/store-interface-and-intial-values/map-state';
import {
  useStoreLayerAllVisibleAndInRangeLayers,
  useStoreLayerIsHiddenOnMapSet,
  useStoreLayerNameSet,
  useStoreLayerStatusSet,
} from 'geoview-core/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeGeochartResultSetEntry } from 'geoview-core/core/stores/store-interface-and-intial-values/geochart-state';
import {
  useStoreGeochartChartsConfig,
  useStoreGeochartLayerDataArrayBatch,
  useStoreGeochartSelectedLayerPath,
} from 'geoview-core/core/stores/store-interface-and-intial-values/geochart-state';
import { useStoreAppDisplayLanguage } from 'geoview-core/core/stores/store-interface-and-intial-values/app-state';
import { getLocalizedMessage } from 'geoview-core/core/utils/utilities';
import { logger } from 'geoview-core/core/utils/logger';
import { CONTAINER_TYPE, TABS } from 'geoview-core/core/utils/constant';

import { GeoChart } from './geochart';
import type { GeoViewGeoChartRootConfig } from './geochart-types';
import { convertGeoViewGeoChartConfigFromCore } from './geochart-types';
import { useGeoChartController } from 'geoview-core/core/controllers/use-controllers';

/** Properties for the GeoChartPanel component. */
interface GeoChartPanelProps {
  mapId: string;
  provideCallbackRedraw?: (callbackRedraw: () => void) => void;
}

/**
 * Geo Chart Panel with Layers on the left and Charts on the right.
 *
 * @param props - The properties passed to geo chart
 * @returns Geo Chart tab
 */
export function GeoChartPanel(props: GeoChartPanelProps): JSX.Element {
  // Log
  logger.logTraceRender('geoview-geochart/geochart-panel');

  const { cgpv } = window as TypeWindow;
  const { mapId, provideCallbackRedraw } = props;
  const { reactUtilities } = cgpv;
  const { useState, useCallback, useMemo, useEffect, useRef } = reactUtilities.react;

  // Get states and actions from store
  const configObj = useStoreGeochartChartsConfig();
  const displayLanguage = useStoreAppDisplayLanguage();
  const visibleInRangeLayers = useStoreLayerAllVisibleAndInRangeLayers();
  const mapClickCoordinates = useStoreMapClickCoordinates();
  const layerHiddenSet = useStoreLayerIsHiddenOnMapSet();
  const layerNames = useStoreLayerNameSet();
  const layerStatuses = useStoreLayerStatusSet();
  const storeArrayOfLayerData = useStoreGeochartLayerDataArrayBatch();
  const selectedLayerPath = useStoreGeochartSelectedLayerPath();
  const geoChartController = useGeoChartController();

  // Create the validator shared for all the charts in the footer
  const [schemaValidator] = useState<SchemaValidator>(new SchemaValidator());

  // Keep a reference to the redraw callbacks for each GeoChart child components
  const redrawGeochart = useRef<Record<string, () => void>>({});

  /**
   * Redraws the GeoCharts in the Panel.
   */
  const redrawGeoCharts = (): void => {
    // We need to redraw when the canvas isn't 'showing' in the DOM and when the user resizes the canvas placeholder.
    Object.values(redrawGeochart.current).forEach((callback) => {
      // Redraw
      callback();
    });
  };

  // Provide the callback to redraw the GeoCharts in the Panel to the Parent component
  provideCallbackRedraw?.(() => {
    // Redraw the GeoCharts
    redrawGeoCharts();
  });

  // #region Handlers

  /**
   * Handles click on enlarge button in the layout component.
   */
  const handleIsEnlargeClicked = useCallback(() => {
    // Redraw the GeoCharts
    redrawGeoCharts();
  }, []);

  /**
   * Handles when the GeoChart child component is providing its callback to redraw itself.
   *
   * @param key - The GeoChart unique key of the child component
   * @param theCallbackRedraw - The callback to execute whenever we want to redraw the GeoChart
   */
  const handleProvideCallbackRedraw = useCallback((key: string, theCallbackRedraw: () => void): void => {
    // Keep the callback
    redrawGeochart.current[key] = theCallbackRedraw;
  }, []);

  // #region HOOKS

  /**
   * Gets the label for the number of features of a layer.
   *
   * @returns The label string
   */
  const getNumFeaturesLabel = useCallback(
    (layer: TypeGeochartResultSetEntry): string => {
      const numOfFeatures = layer.features?.length ?? 0;
      const label =
        numOfFeatures === 0
          ? `${getLocalizedMessage(displayLanguage, 'geochart.panel.empty')}`
          : `${numOfFeatures} ${getLocalizedMessage(displayLanguage, 'geochart.panel.feature')}${numOfFeatures > 1 ? 's' : ''}`;

      return label;
    },
    [displayLanguage]
  );

  /**
   * Handles clicks to layers in left panel. Sets selected layer.
   *
   * @param layer - The data of the selected layer
   */
  const handleLayerChange = useCallback(
    (layer: LayerListEntry): void => {
      // Set the selected layer path in the store which will in turn trigger the store listeners on this component
      geoChartController.setSelectedLayerPath(layer.layerPath);
    },
    [geoChartController]
  );

  // #endregion

  // Convert the config object from core to geoview-geochart type-equivalent
  const memoConfigObj = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOCHART-PANEL - memoConfigObj', configObj);

    // Memoize a better config object using the geoview-geochart type-equivalent instead of the store's
    return configObj
      ? Object.fromEntries(
          Object.entries(configObj).map(([layerPath, layerChartConfig]) => [
            layerPath,
            { charts: [convertGeoViewGeoChartConfigFromCore(layerChartConfig)] },
          ])
        )
      : {};
  }, [configObj]);

  // Reacts when the array of layer data updates
  const memoLayersList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('GEOCHART-PANEL - memoLayersList', storeArrayOfLayerData);

    // Return empty array if no data
    if (!storeArrayOfLayerData) return [];

    // Set the layers list
    return visibleInRangeLayers.reduce<LayerListEntry[]>((acc, layerPath) => {
      const layer = storeArrayOfLayerData.find((layerData) => layerData.layerPath === layerPath && !layerHiddenSet[layerData.layerPath]);

      if (layer && memoConfigObj[layer.layerPath]) {
        acc.push({
          layerName: layerNames[layer.layerPath] ?? '',
          layerPath: layer.layerPath,
          layerStatus: layerStatuses[layer.layerPath],
          queryStatus: layer.queryStatus,
          numOffeatures: layer.features?.length ?? 0,
          layerFeatures: getNumFeaturesLabel(layer),
          tooltip: `${layerNames[layer.layerPath] ?? ''}, ${getNumFeaturesLabel(layer)}`,
          layerUniqueId: `${mapId}-${TABS.GEO_CHART}-${layer.layerPath}`,
        });
      }

      return acc;
    }, []);
  }, [storeArrayOfLayerData, visibleInRangeLayers, memoConfigObj, layerNames, layerStatuses, layerHiddenSet, getNumFeaturesLabel, mapId]);

  /** Memoizes the selected layer for the LayerList component. */
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
    if (selectedLayerPath) {
      geoChartController.setLayerDataArrayBatchLayerPathBypass(selectedLayerPath);
    }
  }, [geoChartController, selectedLayerPath]);

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
      checkSelectedLayerPathList(
        (lyrPath) => geoChartController.setLayerDataArrayBatchLayerPathBypass(lyrPath),
        (lyrPath) => geoChartController.setSelectedLayerPath(lyrPath),
        memoLayerSelectedItem,
        memoLayersList
      );
    }
  }, [geoChartController, memoLayerSelectedItem, memoLayersList, selectedLayerPath]);

  /**
   * Selects a layer after a map click happened on the map.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DETAILS-PANEL- mapClickCoordinates', mapClickCoordinates);

    // If nothing was previously selected at all
    if (mapClickCoordinates && memoLayersList?.length && !selectedLayerPath?.length) {
      const selectedLayer = memoLayersList.find((layer) => !!layer.numOffeatures);
      // Select the first layer that has features
      geoChartController.setSelectedLayerPath(selectedLayer?.layerPath ?? '');
    }
  }, [geoChartController, mapClickCoordinates, memoLayersList, selectedLayerPath?.length]);

  // #endregion HOOKS

  // #region RENDERING

  /**
   * Renders a single GeoChart component.
   *
   * @param chartsConfig - The Charts Root Config to assign to the GeoChart
   * @param sx - Styling to apply (basically if the GeoChart should be visible or not depending on the selected layer)
   * @param layerPath - The layer path for the chart
   * @returns The rendered GeoChart element
   */
  const renderChart = (chartsConfig: GeoViewGeoChartRootConfig, sx: React.CSSProperties, layerPath: string): JSX.Element => {
    return (
      <GeoChart
        sx={sx}
        key={layerPath}
        mapId={mapId}
        layerPath={layerPath}
        config={chartsConfig}
        layers={storeArrayOfLayerData ?? []}
        schemaValidator={schemaValidator}
        provideCallbackRedraw={(theCallbackRedraw) => handleProvideCallbackRedraw(layerPath, theCallbackRedraw)}
      />
    );
  };

  /**
   * Renders the complete GeoChart Panel component.
   *
   * @returns The rendered panel element
   */
  const renderComplete = (): JSX.Element => {
    if (memoLayersList) {
      return (
        <Layout
          selectedLayerPath={selectedLayerPath}
          layerList={memoLayersList}
          onLayerListClicked={handleLayerChange}
          onIsEnlargeClicked={handleIsEnlargeClicked}
          guideContentIds={['chart', 'chart.children.chartTypes', 'chart.children.chartControls']}
          containerType={CONTAINER_TYPE.FOOTER_BAR}
          titleFullscreen={getLocalizedMessage(displayLanguage, 'geochart.title')}
        >
          {selectedLayerPath && (
            <Box sx={{ '& .MuiButtonGroup-groupedHorizontal.MuiButton-textSizeMedium': { fontSize: '0.9rem' } }}>
              {Object.entries(memoConfigObj).map(([layerPath, layerChartConfig]) => {
                if (layerPath === selectedLayerPath) {
                  return renderChart(layerChartConfig, {}, layerPath);
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
