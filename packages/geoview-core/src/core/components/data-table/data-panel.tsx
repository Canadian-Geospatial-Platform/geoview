import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgress, FilterAltIcon } from '@/ui';
import MapDataTable, { DataTableData } from './data-table';
import { getSxClasses } from './data-table-style';
import { GroupLayers } from './data-table-api';
import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';

import {
  useDataTableStoreActions,
  useDataTableStoreIsEnlargeDataTable,
  useDataTableStoreMapFilteredRecord,
  useDataTableStoreRowsFiltered,
  useDataTableStoreSelectedLayerIndex,
  useMapVisibleLayers,
} from '@/core/stores';

import { ResponsiveGrid, EnlargeButton, CloseButton, LayerList, LayerListEntry, LayerTitle, useFooterPanelHeight } from '../common';
import { logger } from '@/core/utils/logger';

export interface LayersDataType extends DataTableData, GroupLayers {}

interface DatapanelProps {
  layerData: LayersDataType[];
  mapId: string;
  language: TypeDisplayLanguage;
}

/**
 * Build Data panel from map.
 * @param {LayersDataType[]} layerData map data which will be used to build data table.
 * @param {string} mapId id of the map.
 * @return {ReactElement} Data table as react element.
 */

export function Datapanel({ layerData, mapId, language }: DatapanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const sxClasses = getSxClasses(theme);

  const [isLoading, setIsLoading] = useState(false);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);
  const [orderedLayerData, setOrderedLayerData] = useState<LayersDataType[]>([]);

  const selectedLayerIndex = useDataTableStoreSelectedLayerIndex();
  const isEnlargeDataTable = useDataTableStoreIsEnlargeDataTable();
  const mapFiltered = useDataTableStoreMapFilteredRecord();
  const rowsFiltered = useDataTableStoreRowsFiltered();
  const visibleLayers = useMapVisibleLayers();
  const { setSelectedLayerIndex, setIsEnlargeDataTable, setLayersData } = useDataTableStoreActions();

  // Custom hook for calculating the height of footer panel
  const { leftPanelRef, rightPanelRef, panelTitleRef, tableHeight } = useFooterPanelHeight({ footerPanelTab: 'datatable' });

  const handleLayerChange = useCallback((_layer: LayerListEntry, index: number) => {
    setSelectedLayerIndex(index);
    setIsLoading(true);
    setIsLayersPanelVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Check if filtered are being set for each layer.
   * @param {string} layerPath The path of the layer
   * @returns boolean
   */
  const isMapFilteredSelectedForLayer = (layerPath: string): boolean => !!mapFiltered[layerPath];

  /**
   * Get number of features of a layer with filtered or selected layer.
   * @param {string} layerPath the path of the layer
   * @param {number} index index of layer in the list
   * @returns
   */
  const getFeaturesOfLayer = (layerPath: string, index: number): string => {
    return rowsFiltered && rowsFiltered[layerPath]
      ? `${rowsFiltered[layerPath]} ${t('dataTable.featureFiltered')}`
      : `${orderedLayerData[index].features.length} ${t('dataTable.features')}`;
  };

  /**
   * Create layer tooltip
   * @param {TypeLocalizedString} layerName en/fr layer name
   * @param {string} layerPath the path of the layer.
   * @param {number} index an index of the layer in the array.
   * @returns
   */
  const getLayerTooltip = (layerName: string, layerPath: string, index: number): React.ReactNode => {
    return (
      <Box sx={{ display: 'flex', alignContent: 'center', '& svg ': { width: '0.75em', height: '0.75em' } }}>
        {`${layerName}, ${getFeaturesOfLayer(layerPath, index)}`}
        {isMapFilteredSelectedForLayer(layerPath) && <FilterAltIcon />}
      </Box>
    );
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - visibleLayers', visibleLayers, layerData);

    const updatedLayerData = visibleLayers
      .map((layerPath) => layerData.filter((data) => data.layerKey === layerPath)[0])
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
          layerList={orderedLayerData.map((layer, index) => ({
            layerName: layer.layerName![language] ?? '',
            layerPath: layer.layerKey,
            layerFeatures: getFeaturesOfLayer(layer.layerKey, index),
            tooltip: getLayerTooltip(layer.layerName![language] ?? '', layer.layerKey, index),
            mapFilteredIcon: isMapFilteredSelectedForLayer(layer.layerKey) && <FilterAltIcon sx={{ color: theme.palette.grey['500'] }} />,
          }))}
          isEnlargeDataTable={isEnlargeDataTable}
          selectedLayerIndex={selectedLayerIndex}
          handleListItemClick={handleLayerChange}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLayerIndex, isEnlargeDataTable, mapFiltered, rowsFiltered, orderedLayerData]
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

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-PANEL - layerData', layerData);

    setLayersData(layerData);
  }, [layerData, setLayersData]);

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
            {!isLoading && <LayerTitle hideTitle>{layerData![selectedLayerIndex]?.layerName![language] ?? ''}</LayerTitle>}

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
            orderedLayerData.map(({ layerKey, layerId }, index) => (
              <Box key={layerKey}>
                {index === selectedLayerIndex ? (
                  <Box>
                    {orderedLayerData[index]?.features.length ? (
                      <MapDataTable
                        data={orderedLayerData[index]}
                        layerId={layerId}
                        mapId={mapId}
                        layerKey={layerKey}
                        tableHeight={tableHeight}
                      />
                    ) : (
                      'No Data'
                    )}
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
