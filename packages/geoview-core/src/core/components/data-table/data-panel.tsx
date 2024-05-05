import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
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
import { useUIActiveFooterBarTabId } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { LayerListEntry, Layout } from '@/core/components/common';
import { logger } from '@/core/utils/logger';
import { useFeatureFieldInfos } from './hooks';
import { TypeFieldEntry, TypeLayerData } from '@/geo/layer/layer-sets/abstract-layer-set';
import { LAYER_STATUS, TABS } from '@/core/utils/constant';

export interface MappedLayerDataType extends TypeLayerData {
  fieldInfos: Record<string, TypeFieldEntry | undefined>;
}

interface DataPanelType {
  fullWidth?: boolean;
}
/**
 * Build Data panel from map.
 * @returns {JSX.Element} Data table as react element.
 */

export function Datapanel({ fullWidth }: DataPanelType): JSX.Element {
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
      setSelectedLayerPath(_layer.layerPath);
      setIsLoading(true);

      // trigger the fetching of the features when not available OR when layer status is in error
      if (
        !orderedLayerData.filter((layers) => layers.layerPath === _layer.layerPath && !!layers?.features?.length).length ||
        _layer.layerStatus === LAYER_STATUS.ERROR
      ) {
        triggerGetAllFeatureInfo(_layer.layerPath);
      }
    },
    [orderedLayerData, setSelectedLayerPath, triggerGetAllFeatureInfo]
  );

  /**
   * Check if filtered are being set for each layer.
   * @param {string} layerPath The path of the layer
   * @returns boolean
   */
  const isMapFilteredSelectedForLayer = (layerPath: string): boolean =>
    !!datatableSettings[layerPath].mapFilteredRecord && !!datatableSettings[layerPath].rowsFilteredRecord;

  /**
   * Get number of features of a layer with filtered or selected layer or unknown when data table is loaded.
   * @param {string} layerPath the path of the layer
   * @returns
   */
  const getFeaturesOfLayer = (layerPath: string): string => {
    if (datatableSettings[layerPath] && datatableSettings[layerPath].rowsFilteredRecord) {
      return `${datatableSettings[layerPath].rowsFilteredRecord} ${t('dataTable.featureFiltered')}`;
    }
    let featureStr = t('dataTable.noFeatures');
    const features = orderedLayerData?.find((layer) => layer.layerPath === layerPath)?.features?.length ?? 0;
    if (features > 0) {
      featureStr = `${features} ${t('dataTable.features')}`;
    }
    return featureStr;
  };

  /**
   * Create layer tooltip
   * @param {string} layerName en/fr layer name
   * @param {string} layerPath the path of the layer.
   * @returns
   */
  const getLayerTooltip = (layerName: string, layerPath: string): JSX.Element => {
    return (
      <Box sx={{ display: 'flex', alignContent: 'center', '& svg ': { width: '0.75em', height: '0.75em' } }}>
        {`${layerName}, ${getFeaturesOfLayer(layerPath)}`}
        {isMapFilteredSelectedForLayer(layerPath) && <FilterAltIcon />}
      </Box>
    );
  };

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

    // TODO: Get rid of this setTimeout of 1 second?
    const clearLoading = setTimeout(() => {
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
   * Check if layer sttaus is processing while querying
   */
  const memoIsLayerQueryStatusProcessing = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - order layer status processing.');

    return () => !!orderedLayerData.find((layer) => layer.queryStatus === LAYER_STATUS.PROCESSING);
  }, [orderedLayerData]);

  const renderContent = (): JSX.Element | null => {
    if (isLoading || memoIsLayerQueryStatusProcessing()) {
      return <Skeleton variant="rounded" width="100%" height={400} sx={{ bgcolor: theme.palette.grey[400] }} />;
    }
    if (selectedTab === TABS.DATA_TABLE && !isLayerDisabled() && isSelectedLayerHasFeatures()) {
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

  const handleGuideIsOpen = (guideIsOpen: boolean): void => {
    if (guideIsOpen) {
      setSelectedLayerPath('');
    }
  };

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

Datapanel.defaultProps = {
  fullWidth: false,
};
