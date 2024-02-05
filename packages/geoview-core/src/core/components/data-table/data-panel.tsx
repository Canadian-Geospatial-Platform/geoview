import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgress, FilterAltIcon } from '@/ui';
import MapDataTable, { DataTableData } from './data-table';
import { getSxClasses } from './data-table-style';
import { GroupLayers } from './data-table-api';
import {
  useDataTableStoreActions,
  useDataTableStoreIsEnlargeDataTable,
  useDataTableStoreMapFilteredRecord,
  useDataTableStoreRowsFiltered,
  useDataTableStoreSelectedLayerIndex,
  useDetailsStoreLayerDataArray,
  useMapVisibleLayers,
} from '@/core/stores';
import { ResponsiveGrid, EnlargeButton, CloseButton, LayerList, LayerListEntry, LayerTitle, useFooterPanelHeight } from '../common';
import { logger } from '@/core/utils/logger';
import { useFeatureFieldInfos } from './hooks';
import { TypeFieldEntry, TypeLayerData } from '@/app';

export interface LayersDataType extends DataTableData, GroupLayers {}

export interface MappedLayerDataType extends TypeLayerData {
  fieldInfos: Record<string, TypeFieldEntry | undefined>;
}

/**
 * Build Data panel from map.
 * @return {ReactElement} Data table as react element.
 */

export function Datapanel() {
  const { t } = useTranslation();
  const theme = useTheme();

  const layerData = useDetailsStoreLayerDataArray();
  const mapId = 'map-WM1';

  const sxClasses = getSxClasses(theme);

  const [isLoading, setIsLoading] = useState(false);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [orderedLayerData, setOrderedLayerData] = useState<LayersDataType[]>([]);

  const selectedLayerIndex = useDataTableStoreSelectedLayerIndex();
  const isEnlargeDataTable = useDataTableStoreIsEnlargeDataTable();
  const mapFiltered = useDataTableStoreMapFilteredRecord();
  const rowsFiltered = useDataTableStoreRowsFiltered();
  const visibleLayers = useMapVisibleLayers();
  const { setSelectedLayerIndex, setIsEnlargeDataTable } = useDataTableStoreActions();

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef, rightPanelRef, panelTitleRef, tableHeight } = useFooterPanelHeight({ footerPanelTab: 'datatable' });

  // Create columns for data table.
  const mappedLayerData = useFeatureFieldInfos(layerData);

  // Copied similar logic from details-panel, because of the indexes thing
  const findLayerPathIndex = (layerDataArray: LayersDataType[], layerPathSearch: string): number => {
    return layerDataArray.findIndex((item) => item.layerPath === layerPathSearch);
  };

  const handleLayerChange = useCallback(
    (_layer: LayerListEntry) => {
      setSelectedLayerIndex(findLayerPathIndex(orderedLayerData, _layer.layerPath));
      setIsLoading(true);
      setIsLayersPanelVisible(true);
    },
    [orderedLayerData, setSelectedLayerIndex]
  );

  /**
   * Check if filtered are being set for each layer.
   * @param {string} layerPath The path of the layer
   * @returns boolean
   */
  const isMapFilteredSelectedForLayer = (layerPath: string): boolean => !!mapFiltered[layerPath];

  /**
   * Get number of features of a layer with filtered or selected layer.
   * @param {string} layerPath the path of the layer
   * @returns
   */
  const getFeaturesOfLayer = (layerPath: string): string => {
    return rowsFiltered && rowsFiltered[layerPath]
      ? `${rowsFiltered[layerPath]} ${t('dataTable.featureFiltered')}`
      : `${mappedLayerData?.find((layer) => layer.layerPath === layerPath)?.features?.length ?? 0} ${t('dataTable.features')}`;
  };

  /**
   * Create layer tooltip
   * @param {string} layerName en/fr layer name
   * @param {string} layerPath the path of the layer.
   * @returns
   */
  const getLayerTooltip = (layerName: string, layerPath: string): React.ReactNode => {
    return (
      <Box sx={{ display: 'flex', alignContent: 'center', '& svg ': { width: '0.75em', height: '0.75em' } }}>
        {`${layerName}, ${getFeaturesOfLayer(layerPath)}`}
        {isMapFilteredSelectedForLayer(layerPath) && <FilterAltIcon />}
      </Box>
    );
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - visibleLayers', visibleLayers, layerData);

    const updatedLayerData = visibleLayers
      .map((layerPath) => layerData.filter((data) => data.layerPath === layerPath)[0])
      .filter((layer) => layer !== undefined);
    setOrderedLayerData(updatedLayerData);
  }, [visibleLayers, layerData]);

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderList = useCallback(
    () => {
      // Log
      logger.logTraceUseCallback(
        'data-panel.renderList',
        selectedLayerIndex,
        isEnlargeDataTable,
        mapFiltered,
        rowsFiltered,
        orderedLayerData
      );

      return (
        <LayerList
          layerList={mappedLayerData
            .filter(({ features }) => !!features?.length)
            .map((layer) => ({
              layerName: layer.layerName ?? '',
              layerPath: layer.layerPath,
              layerFeatures: getFeaturesOfLayer(layer.layerPath),
              tooltip: getLayerTooltip(layer.layerName ?? '', layer.layerPath),
              mapFilteredIcon: isMapFilteredSelectedForLayer(layer.layerPath) && (
                <FilterAltIcon sx={{ color: theme.palette.geoViewColor.grey.main }} />
              ),
            }))}
          isEnlargeDataTable={isEnlargeDataTable}
          selectedLayerIndex={selectedLayerIndex}
          handleListItemClick={handleLayerChange}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLayerIndex, isEnlargeDataTable, mapFiltered, rowsFiltered, mappedLayerData]
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - isLoading', isLoading, selectedLayerIndex);

    const clearLoading = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(clearLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, selectedLayerIndex]);

  // useEffect(() => {
  //   // Log
  //   logger.logTraceUseEffect('DATA-PANEL - layerData', layerData);

  //   setLayersData(layerData);
  // }, [layerData, setLayersData]);
  console.log('mappedLayerData', mappedLayerData);
  return (
    <Box sx={sxClasses.dataPanel}>
      <ResponsiveGrid.Root sx={{ pt: 8, pb: 8 }} ref={panelTitleRef}>
        <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          <LayerTitle>{t('general.layers')}</LayerTitle>
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              [theme.breakpoints.up('md')]: { justifyContent: 'right' },
              [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
            }}
          >
            {!isLoading && <LayerTitle hideTitle>{layerData![selectedLayerIndex]?.layerName ?? ''}</LayerTitle>}

            <Box>
              <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
              {!isLoading && <CloseButton setIsLayersPanelVisible={setIsLayersPanelVisible} isLayersPanelVisible={isLayersPanelVisible} />}
            </Box>
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root>
        <ResponsiveGrid.Left isLayersPanelVisible={isLayersPanelVisible} isEnlargeDataTable={isEnlargeDataTable} ref={leftPanelRef}>
          {renderList()}
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right isEnlargeDataTable={isEnlargeDataTable} isLayersPanelVisible={isLayersPanelVisible} ref={rightPanelRef}>
          <CircularProgress
            isLoaded={!isLoading}
            sx={{
              backgroundColor: 'inherit',
            }}
          />

          {!isLoading &&
            mappedLayerData
              .filter(({ features }) => !!features?.length)
              .map((data, index) => (
                <Box key={data.layerPath}>
                  {index === selectedLayerIndex ? (
                    <Box>
                      <MapDataTable data={data} mapId={mapId} layerPath={data.layerPath} tableHeight={tableHeight} />
                    </Box>
                  ) : (
                    <Box />
                  )}
                </Box>
              ))}
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
    </Box>
  );
}
