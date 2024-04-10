import { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import Markdown from 'markdown-to-jsx';
import { Box, FilterAltIcon, Paper, Skeleton } from '@/ui';
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
import { useAppGuide } from '@/core/stores/store-interface-and-intial-values/app-state';
import { LayerListEntry, Layout } from '@/core/components/common';
import { logger } from '@/core/utils/logger';
import { useFeatureFieldInfos } from './hooks';
import { TypeFieldEntry, TypeLayerData } from '@/geo/utils/layer-set';
import { getSxClasses } from './data-table-style';
import { LAYER_STATUS, TABS } from '@/core/utils/constant';

export interface MappedLayerDataType extends TypeLayerData {
  fieldInfos: Record<string, TypeFieldEntry | undefined>;
}

interface DataPanelType {
  fullWidth?: boolean;
}
/**
 * Build Data panel from map.
 * @return {ReactElement} Data table as react element.
 */

export function Datapanel({ fullWidth }: DataPanelType) {
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const layerData = useDataTableAllFeaturesDataArray();

  const [isLoading, setIsLoading] = useState(false);

  const tableHeight = useDataTableTableHeight();
  const selectedLayerPath = useDataTableSelectedLayerPath();
  const datatableSettings = useDataTableLayerSettings();
  const { setSelectedLayerPath } = useDataTableStoreActions();
  const { triggerGetAllFeatureInfo } = useDataTableStoreActions();
  const selectedTab = useUIActiveFooterBarTabId();
  const guide = useAppGuide();
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
  const getLayerTooltip = (layerName: string, layerPath: string): ReactNode => {
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

  /**
   * Checks if all layers have no features like features are empty array.
   * @returns
   */
  const isAllLayersNoFeatures = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-PANEL - isAllLayersNoFeatures');

    return () => orderedLayerData.every((layers) => !layers?.features?.length);
  }, [orderedLayerData]);

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

  return (
    <Layout
      selectedLayerPath={selectedLayerPath || ''}
      layerList={orderedLayerData.map((layer) => ({
        ...layer,
        layerFeatures: getFeaturesOfLayer(layer.layerPath),
        tooltip: getLayerTooltip(layer.layerName ?? '', layer.layerPath),
        mapFilteredIcon: isMapFilteredSelectedForLayer(layer.layerPath) && (
          <FilterAltIcon sx={{ color: theme.palette.geoViewColor.grey.main }} />
        ),
      }))}
      onLayerListClicked={handleLayerChange}
      fullWidth={fullWidth}
    >
      {isLoading && <Skeleton variant="rounded" width="100%" height={400} sx={{ bgcolor: theme.palette.grey[400] }} />}

      {!isLoading &&
        selectedTab === TABS.DATA_TABLE &&
        !isLayerDisabled() &&
        isSelectedLayerHasFeatures() &&
        orderedLayerData.map((data: MappedLayerDataType) => (
          <Box key={data.layerPath}>
            {data.layerPath === selectedLayerPath ? (
              <DataTable data={data} layerPath={data.layerPath} tableHeight={tableHeight} />
            ) : (
              <Box />
            )}
          </Box>
        ))}

      {/* show data table instructions when all layers has no features */}
      {((!isLoading && isAllLayersNoFeatures()) || isLayerDisabled() || selectedLayerPath === '') && (
        <Box
          sx={
            fullWidth
              ? { ...sxClasses.rightPanelContainer, overflowY: 'none' }
              : { ...sxClasses.rightPanelContainer, maxHeight: '600px', overflowY: 'none' }
          }
        >
          <Paper sx={{ padding: '2rem' }}>
            <Box className="guideBox">
              <Markdown options={{ wrapper: 'article' }}>{`${guide!.footerPanel!.children!.dataTable!.content}\n${
                guide!.footerPanel!.children!.dataTable!.children!.filterData!.content
              }\n${guide!.footerPanel!.children!.dataTable!.children!.sortingAndReordering!.content}\n\n${
                guide!.footerPanel!.children!.dataTable!.children!.keyboardNavigation!.content
              }`}</Markdown>
            </Box>
          </Paper>
        </Box>
      )}
    </Layout>
  );
}

Datapanel.defaultProps = {
  fullWidth: false,
};
