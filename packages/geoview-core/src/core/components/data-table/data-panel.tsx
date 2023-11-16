import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Projection } from 'ol/proj';
import { useTranslation } from 'react-i18next';
import { Box, Typography, CircularProgress, FilterAltIcon } from '@/ui';
import MapDataTable, { MapDataTableData as MapDataTableDataProps } from './map-data-table';
import { getSxClasses } from './data-table-style';
import { GroupLayers } from './data-table-api';
import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';

import {
  useDataTableStoreActions,
  useDataTableStoreIsEnlargeDataTable,
  useDataTableStoreMapFilteredRecord,
  useDataTableStoreRowsFiltered,
  useDataTableStoreSelectedLayerIndex,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';

import { ResponsiveGrid, EnlargeButton, CloseButton, LayerList, LayerListEntry } from '../common';

interface DatapanelProps {
  layerData: (MapDataTableDataProps & GroupLayers)[];
  mapId: string;
  projectionConfig: Projection;
  language: TypeDisplayLanguage;
}

/**
 * Build Data panel from map.
 * @param {MapDataTableProps} layerData map data which will be used to build data table.
 * @param {string} mapId id of the map.
 * @param {Projection} projectionConfig projection config to transfer lat long.
 * @return {ReactElement} Data table as react element.
 */

export function Datapanel({ layerData, mapId, projectionConfig, language }: DatapanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const sxClasses = getSxClasses(theme);

  const [isLoading, setIsLoading] = useState(false);
  const [isLayersPanelVisible, setIsLayersPanelVisible] = useState(false);

  const selectedLayerIndex = useDataTableStoreSelectedLayerIndex();
  const isEnlargeDataTable = useDataTableStoreIsEnlargeDataTable();
  const mapFiltered = useDataTableStoreMapFilteredRecord();
  const rowsFiltered = useDataTableStoreRowsFiltered();
  const { setSelectedLayerIndex, setIsEnlargeDataTable } = useDataTableStoreActions();

  const handleListItemClick = useCallback((layer: LayerListEntry, index: number) => {
    setSelectedLayerIndex(index);
    setIsLoading(true);
    setIsLayersPanelVisible(false);
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
      : `${layerData[index].features.length} ${t('dataTable.features')}`;
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

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderList = useCallback(
    () => (
      <LayerList
        layerList={layerData.map((layer, index) => ({
          layerName: layer.layerName![language] ?? '',
          layerPath: layer.layerKey,
          layerFeatures: getFeaturesOfLayer(layer.layerKey, index),
          tooltip: getLayerTooltip(layer.layerName![language] ?? '', layer.layerKey, index),
          mapFilteredIcon: isMapFilteredSelectedForLayer(layer.layerKey) && <FilterAltIcon sx={{ color: theme.palette.grey['500'] }} />,
        }))}
        isEnlargeDataTable={isEnlargeDataTable}
        selectedLayerIndex={selectedLayerIndex}
        handleListItemClick={handleListItemClick}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layerData, selectedLayerIndex, isEnlargeDataTable, mapFiltered, rowsFiltered]
  );

  useEffect(() => {
    const clearLoading = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(clearLoading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, selectedLayerIndex]);

  return (
    <Box sx={sxClasses.dataPanel}>
      <ResponsiveGrid.Root spacing={2} sx={sxClasses.gridContainer}>
        <ResponsiveGrid.Left xs={isLayersPanelVisible ? 12 : 0} md={4} isLayersPanelVisible={isLayersPanelVisible}>
          <Typography component="p" sx={sxClasses.headline}>
            {t('dataTable.leftPanelHeading')}
          </Typography>
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right xs={!isLayersPanelVisible ? 12 : 0} md={8} isLayersPanelVisible={isLayersPanelVisible}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              [theme.breakpoints.up('md')]: { justifyContent: 'right' },
              [theme.breakpoints.down('md')]: { justifyContent: 'space-between' },
            }}
          >
            <Box sx={{ [theme.breakpoints.up('md')]: { display: 'none' } }}>
              {!isLoading && <Typography component="span">{layerData![selectedLayerIndex]?.layerName![language] ?? ''}</Typography>}
            </Box>
            <Box>
              <EnlargeButton isEnlargeDataTable={isEnlargeDataTable} setIsEnlargeDataTable={setIsEnlargeDataTable} />
              {!isLoading && <CloseButton setIsLayersPanelVisible={setIsLayersPanelVisible} isLayersPanelVisible={isLayersPanelVisible} />}
            </Box>
          </Box>
        </ResponsiveGrid.Right>
      </ResponsiveGrid.Root>
      <ResponsiveGrid.Root sx={{ marginTop: '0.75rem' }}>
        <ResponsiveGrid.Left
          isLayersPanelVisible={isLayersPanelVisible}
          xs={isLayersPanelVisible ? 12 : 0}
          md={!isEnlargeDataTable ? 4 : 1.25}
        >
          {renderList()}
        </ResponsiveGrid.Left>
        <ResponsiveGrid.Right
          xs={!isLayersPanelVisible ? 12 : 0}
          md={!isEnlargeDataTable ? 8 : 10.75}
          isLayersPanelVisible={isLayersPanelVisible}
          sxProps={{ minHeight: '250px' }}
        >
          <CircularProgress
            isLoaded={!isLoading}
            sx={{
              backgroundColor: 'inherit',
            }}
          />

          {!isLoading &&
            layerData.map(({ layerKey, layerId }, index) => (
              <Box key={layerKey}>
                {index === selectedLayerIndex ? (
                  <Box>
                    {layerData[index].features.length ? (
                      <MapDataTable
                        data={layerData[index]}
                        layerId={layerId}
                        mapId={mapId}
                        layerKey={layerKey}
                        projectionConfig={projectionConfig}
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
