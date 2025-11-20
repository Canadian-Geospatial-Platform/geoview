import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, FilterAltIcon } from '@/ui';
import DataTable from './data-table';
import {
  useDataTableSelectedLayerPath,
  useDataTableAllFeaturesDataArray,
  useDataTableLayerSettings,
  useDataTableStoreActions,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useAppShowUnsymbolizedFeatures } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapStoreActions, useMapAllVisibleandInRangeLayers } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useUIActiveAppBarTab,
  useUIActiveFooterBarTabId,
  useUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import type { LayerListEntry } from '@/core/components/common';
import { Layout } from '@/core/components/common';
import { logger } from '@/core/utils/logger';
import { useFeatureFieldInfos } from './hooks';
import { CONTAINER_TYPE, LAYER_STATUS, TABS } from '@/core/utils/constant';
import type { MappedLayerDataType } from './data-table-types';
import { DEFAULT_APPBAR_CORE } from '@/api/types/map-schema-types';
import type { TypeContainerBox } from '@/core/types/global-types';
import DataSkeleton from './data-skeleton';

interface DataPanelType {
  fullWidth?: boolean;
  containerType?: TypeContainerBox;
}
/**
 * Build Data panel from map.
 * @returns {JSX.Element} Data table as react element.
 */

export function Datapanel({ fullWidth = false, containerType = CONTAINER_TYPE.FOOTER_BAR }: DataPanelType): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/data-panel');

  const { t } = useTranslation();
  const theme = useTheme();

  const dataTableRef = useRef<HTMLDivElement>();
  const [isLoading, setIsLoading] = useState(false);
  const isFirstLoad = useRef(true);

  const mapId = useGeoViewMapId();
  const layerData = useDataTableAllFeaturesDataArray();
  const selectedLayerPath = useDataTableSelectedLayerPath();
  const datatableSettings = useDataTableLayerSettings();
  const { setSelectedLayerPath } = useDataTableStoreActions();
  const { triggerGetAllFeatureInfo } = useDataTableStoreActions();
  const { isLayerHiddenOnMap } = useMapStoreActions();
  const selectedTab = useUIActiveFooterBarTabId();
  const visibleInRangeLayers = useMapAllVisibleandInRangeLayers();
  const { tabId, isOpen } = useUIActiveAppBarTab();
  const appBarComponents = useUIAppbarComponents();
  const showUnsymbolizedFeatures = useAppShowUnsymbolizedFeatures();

  // Create columns for data table.
  const mappedLayerData = useFeatureFieldInfos(layerData);

  /**
   * Order the layers by visible layer order.
   */
  const orderedLayerData = useMemo(() => {
    return visibleInRangeLayers
      .map((layerPath) => mappedLayerData.filter((data) => data.layerPath === layerPath)[0])
      .filter((layer) => layer !== undefined && !isLayerHiddenOnMap(layer.layerPath));
  }, [mappedLayerData, visibleInRangeLayers, isLayerHiddenOnMap]);

  /**
   * Update local states when layer is changed from layer list.
   * @param {LayerListEntry} layer layer from layer list is selected.
   */
  const handleLayerChange = useCallback(
    (_layer: LayerListEntry) => {
      // Log
      logger.logTraceUseCallback('DATA-PANEL - handleLayerChange');

      setSelectedLayerPath(_layer.layerPath);
      setIsLoading(true);

      // If the features weren't fetched yet for the layer, trigger it now
      if (!orderedLayerData.filter((layers) => layers.layerPath === _layer.layerPath && !!layers?.features?.length).length) {
        triggerGetAllFeatureInfo(_layer.layerPath).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('Failed to triggerGetAllFeatureInfo in data-panel.handleLayerChange', error);
        });
      }
    },
    [orderedLayerData, setSelectedLayerPath, triggerGetAllFeatureInfo]
  );

  /**
   * Check if filtered are being set for each layer.
   * @param {string} layerPath - The path of the layer
   * @returns boolean
   */
  const isMapFilteredSelectedForLayer = useCallback(
    (layerPath: string): boolean => {
      // Log
      logger.logTraceUseCallback('DATA-PANEL - isMapFilteredSelectedForLayer');

      return datatableSettings[layerPath].mapFilteredRecord && !!datatableSettings[layerPath].rowsFilteredRecord;
    },
    [datatableSettings]
  );

  /**
   * Get number of features of a layer with filtered or selected layer or unknown when data table is loaded.
   * @param {string} layerPath - The path of the layer
   * @returns
   */
  const getFeaturesOfLayer = useCallback(
    (layerPath: string): string => {
      // Log
      logger.logTraceUseCallback('DATA-PANEL - getFeaturesOfLayer');

      if (datatableSettings[layerPath] && datatableSettings[layerPath].rowsFilteredRecord) {
        return `${datatableSettings[layerPath].rowsFilteredRecord} ${t('dataTable.featureFiltered')}`;
      }

      let featureStr = t('dataTable.noFeatures');
      let features = orderedLayerData?.find((layer) => layer.layerPath === layerPath)?.features;

      // Filter unsymbolized features if configured
      if (!showUnsymbolizedFeatures) {
        features = features?.filter((feature) => feature.featureIcon);
      }

      if (features !== undefined) {
        featureStr = `${features?.length} ${t('dataTable.features')}`;
      }
      return featureStr;
    },
    [datatableSettings, orderedLayerData, showUnsymbolizedFeatures, t]
  );

  /**
   * Create layer tooltip
   * @param {string} layerName - en/fr layer name
   * @param {string} layerPath - The path of the layer.
   * @returns
   */
  const getLayerTooltip = useCallback(
    (layerName: string, layerPath: string): JSX.Element => {
      // Log
      logger.logTraceUseCallback('DATA-PANEL - getLayerTooltip');

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
   * Checks if layer is disabled when layer is selected and features have null value.
   * @returns bool
   */
  const isLayerDisabled = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - isLayerDisabled', selectedLayerPath);

    return () => !!orderedLayerData.find((layer) => layer.layerPath === selectedLayerPath && layer.features === null);
  }, [orderedLayerData, selectedLayerPath]);

  /**
   * Checks if selected layer has features.
   */
  const isSelectedLayerHasFeatures = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - isSelectedLayerHasFeatures', selectedLayerPath);

    return () => orderedLayerData.find((layer) => layer.layerPath === selectedLayerPath && layer?.features?.length);
  }, [selectedLayerPath, orderedLayerData]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - isLoading', isLoading, selectedLayerPath);

    const clearLoading = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(clearLoading);
  }, [isLoading, selectedLayerPath]);

  /**
   * This effect will unmount the FOOTER BAR if the tab is changed
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - unmount', selectedLayerPath);

    // NOTE: Reason for not using component unmount, because we are not mounting and unmounting components
    // when we switch tabs.
    if (selectedTab !== TABS.DATA_TABLE && containerType !== CONTAINER_TYPE.APP_BAR) {
      setSelectedLayerPath('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  /**
   * This effect will only run when appbar will have data table as component
   * It will unselect the layer path when component is unmounted.
   */
  useEffect(() => {
    if ((tabId !== DEFAULT_APPBAR_CORE.DATA_TABLE || !isOpen) && appBarComponents.includes(DEFAULT_APPBAR_CORE.DATA_TABLE)) {
      setSelectedLayerPath('');
    }
  }, [tabId, isOpen, setSelectedLayerPath, appBarComponents]);

  // If has selected layer on load and the data for selectedLayerPath is empty, trigger a query
  // TODO Occasionally, setting the default selected layer can have unexpected behaviours.
  // TO.DOCONT e.g. Refresh the page, switch tabs in the browser, come back to tab when done. The layer isn't selected
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;

      if (selectedLayerPath && orderedLayerData.find((lyr) => lyr.layerPath === selectedLayerPath)) {
        setIsLoading(true);
        triggerGetAllFeatureInfo(selectedLayerPath)
          .catch((error: unknown) => {
            // Log error
            logger.logError(`Data panel has failed to get all feature info, error: ${error}`);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [orderedLayerData, selectedLayerPath, triggerGetAllFeatureInfo]);

  /**
   * Check if layer sttaus is processing while querying
   */
  const memoIsLayerQueryStatusProcessing = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - order layer status processing.');

    return () => !!orderedLayerData.find((layer) => layer.queryStatus === LAYER_STATUS.PROCESSING);
  }, [orderedLayerData]);

  /**
   * Render the right panel content based on table data and layer loading status.
   * NOTE: Here we return null, so that in responsive grid layout, it can be used as flag to render the guide for data table.
   * @returns {JSX.Element | null} JSX.Element | null
   */
  const renderContent = (): JSX.Element | null => {
    if (isLoading || memoIsLayerQueryStatusProcessing()) {
      return <DataSkeleton />;
    }
    if (!isLayerDisabled() && isSelectedLayerHasFeatures()) {
      return (
        <>
          {orderedLayerData
            .filter((data) => data.layerPath === selectedLayerPath)
            .map((data: MappedLayerDataType) => (
              <Box key={data.layerPath} ref={dataTableRef} className="data-table-panel" sx={{ height: '100%' }}>
                <DataTable data={data} layerPath={data.layerPath} containerType={containerType} />
              </Box>
            ))}
        </>
      );
    }

    return null;
  };

  const memoLayerList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - memoLayersList', orderedLayerData);

    return orderedLayerData.map((layer) => ({
      ...layer,
      layerUniqueId: `${mapId}-${TABS.DATA_TABLE}-${layer.layerPath}`,
      layerFeatures: getFeaturesOfLayer(layer.layerPath),
      tooltip: getLayerTooltip(layer.layerName ?? '', layer.layerPath),
      mapFilteredIcon: isMapFilteredSelectedForLayer(layer.layerPath) && (
        <FilterAltIcon sx={{ color: theme.palette.geoViewColor.grey.main, verticalAlign: 'middle' }} />
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapFilteredSelectedForLayer, orderedLayerData]);

  return (
    <Layout
      containerType={containerType}
      selectedLayerPath={selectedLayerPath}
      layerList={memoLayerList}
      onLayerListClicked={handleLayerChange}
      fullWidth={fullWidth}
      guideContentIds={[
        'dataTable',
        'dataTable.children.filterData',
        'dataTable.children.sortingAndReordering',
        'dataTable.children.keyboardNavigation',
      ]}
    >
      {renderContent()}
    </Layout>
  );
}
