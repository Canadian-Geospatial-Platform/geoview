import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, FilterAltIcon } from '@/ui';
import DataTable from './data-table';

import {
  useStoreDataTableSelectedLayerPath,
  useStoreDataTableAllFeaturesDataArray,
  useStoreDataTableLayerSettings,
  getStoreDataTableFeaturesByPath,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useStoreAppShowUnsymbolizedFeatures } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreMapExtent } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useStoreLayerAllVisibleAndInRangeLayers,
  useStoreLayerIsHiddenOnMapSet,
  useStoreLayerNameSet,
  useStoreLayerStatusSet,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useStoreUIActiveAppBarTab,
  useStoreUIActiveFooterBarTab,
  useStoreUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import type { LayerListEntry } from '@/core/components/common';
import { Layout } from '@/core/components/common';
import { logger } from '@/core/utils/logger';
import { useFeatureFieldInfos } from './hooks';
import { CONTAINER_TYPE, LAYER_STATUS, TABS, TIMEOUT } from '@/core/utils/constant';
import type { MappedLayerDataType } from './data-table-types';
import { DEFAULT_APPBAR_CORE } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import DataSkeleton from './data-skeleton';
import { useDataTableController, useLayerSetController, useUIController } from '@/core/controllers/use-controllers';

/** Properties for the Datapanel component. */
interface DataPanelType {
  containerType: TypeContainerBox;
}

/**
 * Renders the data panel with layer list and data table.
 *
 * @param props - Datapanel properties
 * @returns The data panel element
 */
export function Datapanel({ containerType }: DataPanelType): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/data-panel');

  const { t } = useTranslation();
  const theme = useTheme();

  const dataTableRef = useRef<HTMLDivElement>();
  const [isLoading, setIsLoading] = useState(false);

  const mapId = useStoreGeoViewMapId();
  const mapExtent = useStoreMapExtent();
  const uiController = useUIController();
  const layerSetController = useLayerSetController();
  const dataTableController = useDataTableController();
  const layerData = useStoreDataTableAllFeaturesDataArray();
  const selectedLayerPath = useStoreDataTableSelectedLayerPath();
  const datatableSettings = useStoreDataTableLayerSettings();
  const visibleInRangeLayers = useStoreLayerAllVisibleAndInRangeLayers();
  const activeFooterBarTab = useStoreUIActiveFooterBarTab();
  const activeAppBarTab = useStoreUIActiveAppBarTab();
  const appBarComponents = useStoreUIAppbarComponents();
  const showUnsymbolizedFeatures = useStoreAppShowUnsymbolizedFeatures();
  const layerNames = useStoreLayerNameSet();
  const layerStatuses = useStoreLayerStatusSet();
  const layerHiddenSet = useStoreLayerIsHiddenOnMapSet();

  // Create columns for data table.
  const mappedLayerData = useFeatureFieldInfos(layerData);

  /**
   * Orders the layers by visible layer order.
   */
  const memoOrderedLayerData = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - memoOrderedLayerData', visibleInRangeLayers, mappedLayerData);

    return visibleInRangeLayers
      .map((layerPath) => mappedLayerData.filter((data) => data.layerPath === layerPath)[0])
      .filter((layer) => layer !== undefined && !layerHiddenSet[layer.layerPath]);
  }, [mappedLayerData, visibleInRangeLayers, layerHiddenSet]);

  /**
   * Applies filtering to the ordered layer data features.
   */
  const memoFilteredOrderedLayerData = useMemo(() => {
    return memoOrderedLayerData.map((layer) => {
      let { features } = layer;

      // Apply extent filtering if enabled for the selected layer
      if (features && datatableSettings[layer.layerPath]?.filterDataToExtent && mapExtent) {
        features = features.filter((feature) => {
          const { geometry } = feature;
          return geometry?.intersectsExtent(mapExtent);
        });
      }

      // Apply unsymbolized feature filtering if configured
      if (features && !showUnsymbolizedFeatures) {
        features = features.filter((feature) => feature.featureIcon);
      }

      return {
        ...layer,
        features,
      };
    });
  }, [memoOrderedLayerData, mapExtent, showUnsymbolizedFeatures, datatableSettings]);

  /**
   * Handles layer selection change from the layer list.
   */
  const handleLayerChange = useCallback(
    (_layer: LayerListEntry): void => {
      dataTableController.setSelectedLayerPath(_layer.layerPath); // This will trigger the useEffect below to call tiggerGetAllFeatureInfo()
      setIsLoading(true);
    },
    [dataTableController]
  );

  /**
   * Checks if map filtering is active for a given layer.
   *
   * @param layerPath - The path of the layer
   * @returns Whether the layer has active map filters
   */
  const isMapFilteredSelectedForLayer = useCallback(
    (layerPath: string): boolean => {
      return datatableSettings[layerPath].mapFilteredRecord && !!datatableSettings[layerPath].rowsFilteredRecord;
    },
    [datatableSettings]
  );

  /**
   * Gets the feature count string for a layer.
   *
   * @param layerPath - The path of the layer
   * @returns The formatted feature count string
   */
  const getFeaturesOfLayer = useCallback(
    (layerPath: string): string => {
      if (datatableSettings[layerPath] && datatableSettings[layerPath].rowsFilteredRecord) {
        return `${datatableSettings[layerPath].rowsFilteredRecord} ${t('dataTable.featureFiltered')}`;
      }

      let featureStr = t('dataTable.noFeatures');
      const features = memoFilteredOrderedLayerData?.find((layer) => layer.layerPath === layerPath)?.features;

      if (features !== undefined) {
        featureStr = `${features?.length} ${t('dataTable.features')}`;
      }
      return featureStr;
    },
    [datatableSettings, memoFilteredOrderedLayerData, t]
  );

  /**
   * Creates a tooltip element for a layer.
   *
   * @param layerName - The en/fr layer name
   * @param layerPath - The path of the layer
   * @returns The tooltip element
   */
  const getLayerTooltip = useCallback(
    (layerName: string, layerPath: string): JSX.Element => {
      return (
        <Box sx={{ display: 'flex', alignContent: 'center', '& svg ': { width: '0.75em', height: '0.75em' } }}>
          {`${layerName}, ${getFeaturesOfLayer(layerPath)}`}
          {isMapFilteredSelectedForLayer(layerPath) && <FilterAltIcon />}
        </Box>
      );
    },
    [getFeaturesOfLayer, isMapFilteredSelectedForLayer]
  );

  /**
   * Handles panel close and restores focus to the layer list item.
   */
  const handlePanelClosed = useCallback((): void => {
    // If we have a selected layer, tell disableFocusTrap to focus it
    if (selectedLayerPath) {
      // Build the full layer list item ID that matches the DOM
      const layerListItemId = `${mapId}-${containerType}-${TABS.DATA_TABLE}-${selectedLayerPath}`;
      uiController.disableFocusTrap(layerListItemId);
    } else {
      uiController.disableFocusTrap('no-focus');
    }
  }, [mapId, selectedLayerPath, uiController, containerType]);

  /**
   * Checks if the selected layer is disabled due to null features.
   */
  const memoIsLayerDisabled = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - isLayerDisabled', selectedLayerPath);

    return () => !!memoOrderedLayerData.find((layer) => layer.layerPath === selectedLayerPath && layer.features === null);
  }, [memoOrderedLayerData, selectedLayerPath]);

  /**
   * Checks if the selected layer has features.
   */
  const memoIsSelectedLayerHasFeatures = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - isSelectedLayerHasFeatures', selectedLayerPath);

    return () => memoOrderedLayerData.find((layer) => layer.layerPath === selectedLayerPath && layer?.features?.length);
  }, [selectedLayerPath, memoOrderedLayerData]);

  /**
   * Clears the loading state after a timeout.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - isLoading', isLoading, selectedLayerPath);

    const clearLoading = setTimeout(() => {
      setIsLoading(false);
    }, TIMEOUT.dataPanelLoading);
    return () => clearTimeout(clearLoading);
  }, [isLoading, selectedLayerPath]);

  /**
   * Unmounts the footer bar data table when the tab changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - unmount');

    // NOTE: Reason for not using component unmount, because we are not mounting and unmounting components
    // when we switch tabs.
    if (activeFooterBarTab.tabId !== TABS.DATA_TABLE && containerType !== CONTAINER_TYPE.APP_BAR) {
      dataTableController.setSelectedLayerPath('');
    }
  }, [dataTableController, activeFooterBarTab, containerType]);

  /**
   * Resets the selected layer path when the app bar data table tab is closed.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - isOpen', activeAppBarTab.isOpen);

    if (
      (activeAppBarTab.tabId !== DEFAULT_APPBAR_CORE.DATA_TABLE || !activeAppBarTab.isOpen) &&
      appBarComponents.includes(DEFAULT_APPBAR_CORE.DATA_TABLE)
    ) {
      dataTableController.setSelectedLayerPath('');
    }
  }, [dataTableController, activeAppBarTab, appBarComponents]);

  /**
   * Triggers feature info query on first load of the selected layer.
   *
   * TODO: Occasionally, setting the default selected layer can have unexpected behaviours.
   * e.g. Refresh the page, switch tabs in the browser, come back to tab when done. The layer isn't selected.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - selectedLayerPath', selectedLayerPath);

    // If any selected layer path
    if (selectedLayerPath) {
      // Get the features already loaded in the store, if any
      const features = getStoreDataTableFeaturesByPath(mapId, selectedLayerPath);

      // If no features were already loaded (not even an empty array)
      if (!features) {
        // Check if the layer is visible and in range (stable check that doesn't change when features load)
        const isLayerAvailable = visibleInRangeLayers.includes(selectedLayerPath);

        if (isLayerAvailable) {
          setIsLoading(true);
          layerSetController
            .triggerGetAllFeatureInfo(selectedLayerPath, true)
            .catch((error: unknown) => {
              // Log error
              logger.logError(`Data panel has failed to get all feature info, error: ${error}`);
            })
            .finally(() => {
              setIsLoading(false);
            });
        }
      }
    }
  }, [selectedLayerPath, visibleInRangeLayers, layerSetController, mapId]);

  /**
   * Checks if any layer query status is processing.
   */
  const memoIsLayerQueryStatusProcessing = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - order layer status processing.');

    return () => !!memoOrderedLayerData.find((layer) => layer.queryStatus === LAYER_STATUS.PROCESSING);
  }, [memoOrderedLayerData]);

  /**
   * Renders the right panel content based on table data and layer loading status.
   *
   * NOTE: Returns null so that responsive grid layout can use it as a flag to render the guide for data table.
   *
   * @returns The content element, or null when no data to show
   */
  const renderContent = (): JSX.Element | null => {
    if (isLoading || memoIsLayerQueryStatusProcessing()) {
      return <DataSkeleton />;
    }
    if (!memoIsLayerDisabled() && memoIsSelectedLayerHasFeatures()) {
      return (
        <>
          {memoFilteredOrderedLayerData
            .filter((data) => data.layerPath === selectedLayerPath)
            .map((data: MappedLayerDataType) => {
              // Get unfiltered count from orderedLayerData
              const unfilteredLayer = memoOrderedLayerData.find((layer) => layer.layerPath === selectedLayerPath);
              const unfilteredFeaturesCount = unfilteredLayer?.features?.length ?? 0;

              return (
                <Box key={data.layerPath} ref={dataTableRef} className="data-table-panel" sx={{ height: '100%' }}>
                  <DataTable
                    data={data}
                    layerPath={data.layerPath}
                    containerType={containerType}
                    unfilteredFeaturesCount={unfilteredFeaturesCount}
                  />
                </Box>
              );
            })}
        </>
      );
    }

    return null;
  };

  /**
   * Builds the layer list entries for the layout component.
   */
  const memoLayerList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - memoLayersList', memoOrderedLayerData);

    return memoOrderedLayerData.map((layer) => ({
      ...layer,
      layerName: layerNames[layer.layerPath],
      layerStatus: layerStatuses[layer.layerPath],
      layerUniqueId: `${mapId}-${containerType}-${TABS.DATA_TABLE}-${layer.layerPath}`,
      layerFeatures: getFeaturesOfLayer(layer.layerPath),
      tooltip: getLayerTooltip(layerNames[layer.layerPath] ?? '', layer.layerPath),
      mapFilteredIcon: isMapFilteredSelectedForLayer(layer.layerPath) && (
        <FilterAltIcon sx={{ color: theme.palette.geoViewColor.grey.main, verticalAlign: 'middle' }} />
      ),
    }));
  }, [
    containerType,
    getFeaturesOfLayer,
    getLayerTooltip,
    isMapFilteredSelectedForLayer,
    layerNames,
    layerStatuses,
    mapId,
    memoOrderedLayerData,
    theme.palette.geoViewColor.grey.main,
  ]);

  return (
    <Layout
      containerType={containerType}
      titleFullscreen={t('dataTable.title')}
      selectedLayerPath={selectedLayerPath}
      layerList={memoLayerList}
      onLayerListClicked={handleLayerChange}
      guideContentIds={[
        'dataTable',
        'dataTable.children.filterData',
        'dataTable.children.sortingAndReordering',
        'dataTable.children.keyboardNavigation',
      ]}
      onRightPanelClosed={handlePanelClosed}
    >
      {renderContent()}
    </Layout>
  );
}
