import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
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
  ListItemText,
  IconButton,
  ListItemIcon,
  SendIcon,
  ChevronRightIcon,
  CircularProgress,
  Button,
  ArrowForwardIcon,
  ArrowBackIcon,
} from '@/ui';
import MapDataTable, { MapDataTableData as MapDataTableDataProps } from './map-data-table';
import { getSxClasses } from './data-table-style';

interface DatapanelProps {
  layerIds: string[];
  layerData: MapDataTableDataProps[];
  mapId: string;
  projectionConfig: Projection;
  layerKeys: string[];
}

/**
 * Build Data panel from map.
 * @param {MapDataTableProps} layerData map data which will be used to build data table.
 * @param {string} layerId id of the layer
 * @param {string} mapId id of the map.
 * @param {string} layerKeys list of keys of the layer.
 * @param {Projection} projectionConfig projection config to transfer lat long.
 * @return {ReactElement} Data table as react element.
 */

export function Datapanel({ layerData, mapId, projectionConfig, layerKeys, layerIds }: DatapanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [isLoading, setisLoading] = useState(false);
  const [isEnlargeDataTable, setIsEnlargeDataTable] = useState(false);

  const handleListItemClick = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    setSelectedLayerIndex(index);
    setisLoading(true);
  }, []);

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderList = useCallback(
    () => (
      <List sx={sxClasses.list}>
        {layerKeys.map((layerKey, index) => (
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
                  <SendIcon />
                </ListItemIcon>

                <ListItemText primary={layerKey} secondary={`${layerData[index].features.length} features`} />
                <Box
                  sx={{
                    background: isEnlargeDataTable ? 'white' : 'none',
                    padding: isEnlargeDataTable ? '0.25rem' : '1rem',
                    paddingRight: isEnlargeDataTable ? '0.25rem' : '1rem',
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
    [selectedLayerIndex, isEnlargeDataTable]
  );

  useEffect(() => {
    const clearLoading = setTimeout(() => {
      setisLoading(false);
    }, 1000);
    return () => clearTimeout(clearLoading);
  }, [isLoading, selectedLayerIndex]);

  return (
    <Box sx={sxClasses.dataPanel}>
      <Grid container spacing={2} sx={sxClasses.gridContainer}>
        <Grid item xs={3}>
          <Typography component="p" sx={sxClasses.headline}>
            {t('dataTable.leftPanelHeading')}
          </Typography>
        </Grid>

        <Grid item xs={7}>
          <Typography component="p" sx={sxClasses.headline}>
            {t('dataTable.rightPanelHeading')}
          </Typography>
        </Grid>
        <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'right' }}>
          <Button type="text" size="small" sx={sxClasses.enlargeBtn} onClick={() => setIsEnlargeDataTable(!isEnlargeDataTable)}>
            {isEnlargeDataTable ? <ArrowBackIcon sx={sxClasses.enlargeBtnIcon} /> : <ArrowForwardIcon sx={sxClasses.enlargeBtnIcon} />}
            {isEnlargeDataTable ? t('dataTable.reduceBtn') : t('dataTable.enlargeBtn')}
          </Button>
        </Grid>
      </Grid>
      <Grid container sx={{ marginTop: '0.75rem' }}>
        <Grid item xs={!isEnlargeDataTable ? 3 : 1.5}>
          {renderList()}
        </Grid>
        <Grid item xs={!isEnlargeDataTable ? 9 : 10.5} sx={{ paddingLeft: '1rem' }}>
          <Typography component="p" sx={sxClasses.headline}>
            {layerKeys[selectedLayerIndex]}
          </Typography>

          <CircularProgress isLoaded={!isLoading} style={{ marginTop: '1rem' }} />

          {!isLoading &&
            layerKeys.map((layerKey, index) => (
              <Box key={layerKey} sx={{ display: index === selectedLayerIndex ? 'block' : 'none' }}>
                {layerData[index].features.length ? (
                  <MapDataTable
                    data={layerData[index]}
                    layerId={layerIds[index]}
                    mapId={mapId}
                    layerKey={layerKey}
                    projectionConfig={projectionConfig}
                  />
                ) : (
                  'No Data'
                )}
              </Box>
            ))}
        </Grid>
      </Grid>
    </Box>
  );
}
