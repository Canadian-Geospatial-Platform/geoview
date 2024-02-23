import { useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, FilterAltIcon, Paper, Skeleton, Typography } from '@/ui';
import DataTable from './data-table';
import {
  useDataTableStoreActions,
  useDataTableStoreMapFilteredRecord,
  useDataTableStoreRowsFiltered,
  useDataTableStoreSelectedLayerPath,
  useDetailsStoreActions,
  useDetailsStoreAllFeaturesDataArray,
  useUIActiveFooterBarTabId,
  useMapOrderedLayerInfo,
} from '@/core/stores';
import { LayerListEntry, useFooterPanelHeight, Layout } from '../common';
import { logger } from '@/core/utils/logger';
import { useFeatureFieldInfos } from './hooks';
import { LAYER_STATUS, TypeFieldEntry, TypeLayerData } from '@/app';
import { getSxClasses } from './data-table-style';

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

  const layerData = useDetailsStoreAllFeaturesDataArray();

  const [isLoading, setIsLoading] = useState(false);

  const selectedLayerPath = useDataTableStoreSelectedLayerPath();
  const mapFiltered = useDataTableStoreMapFilteredRecord();
  const rowsFiltered = useDataTableStoreRowsFiltered();
  const { setSelectedLayerPath } = useDataTableStoreActions();
  const { triggerGetAllFeatureInfo } = useDetailsStoreActions();
  const selectedTab = useUIActiveFooterBarTabId();
  const orderedLayerInfo = useMapOrderedLayerInfo();

  // Custom hook for calculating the height of footer panel
  const { tableHeight } = useFooterPanelHeight({ footerPanelTab: 'data-table' });

  // Create columns for data table.
  const mappedLayerData = useFeatureFieldInfos(layerData);

  /**
   * Order the layers by visible layer order.
   */
  const orderedLayerData = useMemo(() => {
    const visibleLayers = orderedLayerInfo
      .map((layerInfo) => {
        if (layerInfo.visible) return layerInfo.layerPath;
        return undefined;
      })
      .filter((layerPath) => layerPath !== undefined);

    return visibleLayers
      .map((layerPath) => mappedLayerData.filter((data) => data.layerPath === layerPath)[0])
      .filter((layer) => layer !== undefined);
  }, [mappedLayerData, orderedLayerInfo]);

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
        triggerGetAllFeatureInfo(_layer.layerPath, 'all');
      }
    },
    [orderedLayerData, setSelectedLayerPath, triggerGetAllFeatureInfo]
  );

  /**
   * Check if filtered are being set for each layer.
   * @param {string} layerPath The path of the layer
   * @returns boolean
   */
  const isMapFilteredSelectedForLayer = (layerPath: string): boolean => !!mapFiltered[layerPath] && !!rowsFiltered[layerPath];

  /**
   * Get number of features of a layer with filtered or selected layer.
   * @param {string} layerPath the path of the layer
   * @returns
   */
  const getFeaturesOfLayer = (layerPath: string): string => {
    return rowsFiltered && rowsFiltered[layerPath]
      ? `${rowsFiltered[layerPath]} ${t('dataTable.featureFiltered')}`
      : `${orderedLayerData?.find((layer) => layer.layerPath === layerPath)?.features?.length ?? 0} ${t('dataTable.features')}`;
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
  const isLayerDisabled = (): boolean =>
    !!orderedLayerData.find((layer) => layer.layerPath === selectedLayerPath && layer.features === null);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - isLoading', isLoading, selectedLayerPath);

    // TODO: Get rid of this setTimeout of 1 second?
    const clearLoading = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(clearLoading);
  }, [isLoading, selectedLayerPath]);

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
      {isLoading && <Skeleton variant="rounded" width="100%" height={400} />}

      {!isLoading &&
        selectedTab === 'data-table' &&
        orderedLayerData.map((data) => (
          <Box key={data.layerPath}>
            {data.layerPath === selectedLayerPath ? (
              <DataTable data={data} layerPath={data.layerPath} tableHeight={tableHeight} />
            ) : (
              <Box />
            )}
          </Box>
        ))}

      {/* show data table instructions when all layers has no features */}
      {((!isLoading && orderedLayerData.every((layers) => !layers?.features?.length)) || isLayerDisabled()) && (
        <Paper sx={{ padding: '2rem' }}>
          <Typography variant="h3" gutterBottom sx={sxClasses.dataTableInstructionsTitle}>
            {t('dataTable.dataTableInstructions')}
          </Typography>
          <Typography component="p" sx={sxClasses.dataTableInstructionsBody}>
            {t('dataTable.selectVisbleLayer')}
          </Typography>
        </Paper>
      )}
    </Layout>
  );
}

Datapanel.defaultProps = {
  fullWidth: false,
};
