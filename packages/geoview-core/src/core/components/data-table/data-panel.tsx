import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { delay } from 'lodash';
import { Box, FilterAltIcon, Skeleton } from '@/ui';
import DataTable from './data-table';
import {
  useDataTableSelectedLayerPath,
  useDataTableAllFeaturesDataArray,
  useDataTableLayerSettings,
  useDataTableTableHeight,
  useDataTableStoreActions,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useMapVisibleLayers } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useActiveAppBarTab,
  useUIActiveFooterBarTabId,
  useUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { LayerListEntry, Layout } from '@/core/components/common';
import { logger } from '@/core/utils/logger';
import { useFeatureFieldInfos } from './hooks';
import { CONTAINER_TYPE, LAYER_STATUS, TABS } from '@/core/utils/constant';
import { MappedLayerDataType } from './data-table-types';
import { CV_DEFAULT_APPBAR_CORE } from '@/api/config/types/config-constants';
import { TypeContainerBox } from '@/core/types/global-types';

interface DataPanelType {
  fullWidth?: boolean;
  containerType?: TypeContainerBox;
}
/**
 * Build Data panel from map.
 * @returns {JSX.Element} Data table as react element.
 */

export function Datapanel({ fullWidth = false, containerType = CONTAINER_TYPE.FOOTER_BAR }: DataPanelType): JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();

  const layerData = useDataTableAllFeaturesDataArray();

  const [isLoading, setIsLoading] = useState(false);

  const tableHeight = useDataTableTableHeight();
  const selectedLayerPath = useDataTableSelectedLayerPath();
  const datatableSettings = useDataTableLayerSettings();
  const { setSelectedLayerPath } = useDataTableStoreActions();
  const { triggerGetAllFeatureInfo } = useDataTableStoreActions();
  const selectedTab = useUIActiveFooterBarTabId();
  const visibleLayers = useMapVisibleLayers();
  const { tabGroup, isOpen } = useActiveAppBarTab();
  const appBarComponents = useUIAppbarComponents();

  // Create columns for data table.
  const mappedLayerData = useFeatureFieldInfos(layerData);

  /**
   * Order the layers by visible layer order.
   */
  const orderedLayerData = useMemo(() => {
    return visibleLayers
      .map((layerPath) => mappedLayerData.filter((data) => data.layerPath === layerPath)[0])
      .filter((layer) => layer !== undefined);
  }, [mappedLayerData, visibleLayers]);

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

      // trigger the fetching of the features when not available OR when layer status is in error
      if (
        !orderedLayerData.filter((layers) => layers.layerPath === _layer.layerPath && !!layers?.features?.length).length ||
        _layer.layerStatus === LAYER_STATUS.ERROR
      ) {
        triggerGetAllFeatureInfo(_layer.layerPath).catch((error) => {
          // Log
          logger.logPromiseFailed('Failed to triggerGetAllFeatureInfo in data-panel.handleLayerChange', error);
        });
      }
    },
    [orderedLayerData, setSelectedLayerPath, triggerGetAllFeatureInfo]
  );

  /**
   * Check if filtered are being set for each layer.
   * @param {string} layerPath The path of the layer
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
   * @param {string} layerPath the path of the layer
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
      const features = orderedLayerData?.find((layer) => layer.layerPath === layerPath)?.features?.length ?? 0;
      if (features > 0) {
        featureStr = `${features} ${t('dataTable.features')}`;
      }
      return featureStr;
    },
    [datatableSettings, orderedLayerData, t]
  );

  /**
   * Create layer tooltip
   * @param {string} layerName en/fr layer name
   * @param {string} layerPath the path of the layer.
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

    const clearLoading = delay(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(clearLoading);
  }, [isLoading, selectedLayerPath]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - unmount', selectedLayerPath);

    // NOTE: Reason for not using component unmount, because we are not mounting and unmounting components
    // when we switch tabs.
    if (selectedTab !== TABS.DATA_TABLE) {
      setSelectedLayerPath('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  /**
   * This effect will only run when appbar will have data table as component
   * It will unselect the layer path when component is unmounted.
   */
  useEffect(() => {
    if ((tabGroup !== CV_DEFAULT_APPBAR_CORE.DATA_TABLE || !isOpen) && appBarComponents.includes(CV_DEFAULT_APPBAR_CORE.DATA_TABLE)) {
      setSelectedLayerPath('');
    }
  }, [tabGroup, isOpen, setSelectedLayerPath, appBarComponents]);

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
      return <Skeleton variant="rounded" width="100%" height={400} sx={{ bgcolor: theme.palette.grey[400] }} />;
    }
    if (!isLayerDisabled() && isSelectedLayerHasFeatures()) {
      return (
        <>
          {orderedLayerData.map((data: MappedLayerDataType) => (
            <Box key={data.layerPath}>
              {data.layerPath === selectedLayerPath ? <DataTable data={data} layerPath={data.layerPath} tableHeight={tableHeight} /> : null}
            </Box>
          ))}
        </>
      );
    }

    return null;
  };

  /**
   * Callback function to update the store state for clearing the selecting layer from left panel.
   */
  const handleGuideIsOpen = useCallback(
    (guideIsOpen: boolean): void => {
      if (guideIsOpen) {
        setSelectedLayerPath('');
      }
    },
    [setSelectedLayerPath]
  );

  const memoLayerList = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - memoLayersList', orderedLayerData);

    return orderedLayerData.map((layer) => ({
      ...layer,
      layerFeatures: getFeaturesOfLayer(layer.layerPath),
      tooltip: getLayerTooltip(layer.layerName ?? '', layer.layerPath),
      mapFilteredIcon: isMapFilteredSelectedForLayer(layer.layerPath) && (
        <FilterAltIcon sx={{ color: theme.palette.geoViewColor.grey.main }} />
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapFilteredSelectedForLayer, orderedLayerData]);

  return (
    <Layout
      containerType={containerType}
      selectedLayerPath={selectedLayerPath || ''}
      layerList={memoLayerList}
      onLayerListClicked={handleLayerChange}
      fullWidth={fullWidth}
      onGuideIsOpen={handleGuideIsOpen}
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
