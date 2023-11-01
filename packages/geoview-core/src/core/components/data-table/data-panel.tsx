import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useStore } from 'zustand';
import { Projection } from 'ol/proj';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  IconButton,
  ListItemIcon,
  SendIcon,
  ChevronRightIcon,
  CircularProgress,
  Button,
  ArrowForwardIcon,
  ArrowBackIcon,
  Tooltip,
  FilterAltIcon,
} from '@/ui';
import MapDataTable, { MapDataTableData as MapDataTableDataProps } from './map-data-table';
import { getSxClasses } from './data-table-style';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { GroupLayers } from './data-table-api';
import { TypeDisplayLanguage, TypeLocalizedString } from '@/geo/map/map-schema-types';

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
  const store = getGeoViewStore(mapId);

  const [isLoading, setIsLoading] = useState(false);

  const { selectedLayerIndex, setSelectedLayerIndex, isEnlargeDataTable, setIsEnlargeDataTable, mapFilteredMap, rowsFilteredMap } =
    useStore(store, (state) => state.dataTableState);

  const handleListItemClick = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    setSelectedLayerIndex(index);
    setIsLoading(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Check if filtered are being set for each layer.
   * @param {string} layerKey The key of the layer
   * @returns boolean
   */
  const isMapFilteredSelectedForLayer = (layerKey: string): boolean => !!mapFilteredMap[layerKey];

  /**
   * Get number of features of a layer with filtered or selected layer.
   * @param layerKey
   * @param index
   * @returns
   */
  const getFeaturesOfLayer = (layerKey: string, index: number): string => {
    return rowsFilteredMap[layerKey] ? `${rowsFilteredMap[layerKey]} features filtered` : `${layerData[index].features.length} features`;
  };

  /**
   * Create layer tooltip
   * @param {TypeLocalizedString} layerName en/fr layer name
   * @param {string} layerKey the key of the layer.
   * @param {number} index an index of the layer in the array.
   * @returns
   */
  const getLayerTooltip = (layerName: TypeLocalizedString, layerKey: string, index: number): React.ReactNode => {
    return (
      <Box sx={{ display: 'flex', alignContent: 'center', '& svg ': { width: '0.75em', height: '0.75em' } }}>
        {`${layerName[language]}, ${getFeaturesOfLayer(layerKey, index)}`}
        {isMapFilteredSelectedForLayer(layerKey) && <FilterAltIcon />}
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
      <List sx={sxClasses.list}>
        {layerData.map(({ layerKey, layerName }, index) => (
          <Paper
            sx={{ ...sxClasses.paper, border: selectedLayerIndex === index ? sxClasses.borderWithIndex : sxClasses.borderNone }}
            key={layerKey}
          >
            <ListItem disablePadding>
              <ListItemButton
                sx={{ height: '67px' }}
                selected={selectedLayerIndex === index}
                onClick={(event) => handleListItemClick(event, index)}
              >
                <ListItemIcon>
                  <SendIcon sx={{ width: '0.75em', height: '0.75em' }} />
                </ListItemIcon>
                <Tooltip title={getLayerTooltip(layerName!, layerKey, index)} placement="top" arrow>
                  <Box sx={sxClasses.listPrimaryText}>
                    <Typography component="p">{layerName![language]}</Typography>
                    <Box sx={{ display: 'flex', alignContent: 'center' }}>
                      <Typography component="p" variant="subtitle1" noWrap>
                        {getFeaturesOfLayer(layerKey, index)}
                      </Typography>
                      {isMapFilteredSelectedForLayer(layerKey) && <FilterAltIcon sx={{ color: theme.palette.grey['500'] }} />}
                    </Box>
                  </Box>
                </Tooltip>
                <Box
                  sx={{
                    padding: isEnlargeDataTable ? '0.25rem' : '1rem',
                    paddingRight: isEnlargeDataTable ? '0.25rem' : '1rem',
                    [theme.breakpoints.down('xl')]: {
                      display: isEnlargeDataTable ? 'none !important' : 'block',
                    },
                    [theme.breakpoints.down('sm')]: {
                      display: 'none',
                    },
                  }}
                >
                  <IconButton
                    disabled
                    edge="end"
                    size="small"
                    sx={{ color: `${theme.palette.primary.main} !important`, background: `${theme.palette.grey.A100} !important` }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </ListItemButton>
            </ListItem>
          </Paper>
        ))}
      </List>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layerData, selectedLayerIndex, isMapFilteredSelectedForLayer, isEnlargeDataTable]
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
      <Grid container spacing={2} sx={sxClasses.gridContainer}>
        <Grid item xs={3}>
          <Typography component="p" sx={sxClasses.headline}>
            {t('dataTable.leftPanelHeading')}
          </Typography>
        </Grid>

        <Grid item xs={9} sx={{ display: 'flex', justifyContent: 'right' }}>
          <Button type="text" size="small" sx={sxClasses.enlargeBtn} onClick={() => setIsEnlargeDataTable(!isEnlargeDataTable)}>
            {isEnlargeDataTable ? <ArrowForwardIcon sx={sxClasses.enlargeBtnIcon} /> : <ArrowBackIcon sx={sxClasses.enlargeBtnIcon} />}
            {isEnlargeDataTable ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
          </Button>
        </Grid>
      </Grid>
      <Grid container sx={{ marginTop: '0.75rem' }}>
        <Grid item xs={!isEnlargeDataTable ? 4 : 1.25}>
          {renderList()}
        </Grid>
        <Grid item xs={!isEnlargeDataTable ? 8 : 10.75} sx={{ paddingLeft: '1rem', position: 'relative' }}>
          <CircularProgress
            isLoaded={!isLoading}
            sx={{
              backgroundColor: 'inherit',
            }}
          />

          {!isLoading &&
            layerData.map(({ layerKey, layerId }, index) => (
              <Box key={layerKey} sx={{ paddingLeft: '3.5rem' }}>
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
        </Grid>
      </Grid>
    </Box>
  );
}
