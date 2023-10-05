import React, { useState, useCallback, useEffect } from 'react';
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
} from '@/ui';
import MapDataTable, { MapDataTableData as MapDataTableDataProps } from './map-data-table';

interface DatapanelProps {
  layerIds: string[];
  layerData: MapDataTableDataProps[];
  mapId: string;
  projectionConfig: Projection;
  layerKeys: string[];
}

const sxClasses = {
  list: {
    color: 'text.primary',
    marginLeft: '1rem',
    width: '100%',
    paddingRight: '2rem',
  },
  paper: { marginBottom: '1rem', height: '67px' },
  borderWithIndex: '2px solid #515BA5',
  borderNone: 'none',
  headline: { fontSize: '1.125rem', fontWeight: 'bold' },
  dataPanel: { backgroundColor: '#F1F2F5', marginTop: '1rem' },
  gridContainer: { paddingLeft: '1rem', paddingRight: '1rem' },
};

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
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [isLoading, setisLoading] = useState(false);

  // useEffect(() => {}, [isLoading]);

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
            <ListItem
              disablePadding
              secondaryAction={
                <IconButton edge="end" sx={{ color: '#515BA5', background: '#F1F2F5' }}>
                  <ChevronRightIcon />
                </IconButton>
              }
            >
              <ListItemButton
                sx={{ height: '67px' }}
                selected={selectedLayerIndex === index}
                onClick={(event) => handleListItemClick(event, index)}
              >
                <ListItemIcon>
                  <SendIcon />
                </ListItemIcon>

                <ListItemText primary={layerKey} secondary={`${layerData[index].features.length} features`} />
              </ListItemButton>
            </ListItem>
          </Paper>
        ))}
      </List>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedLayerIndex]
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

        <Grid item xs={9}>
          <Typography component="p" sx={sxClasses.headline}>
            {t('dataTable.rightPanelHeading')}
          </Typography>
        </Grid>
      </Grid>
      <Grid container sx={{ marginTop: '0.75rem' }}>
        <Grid item xs={3}>
          {renderList()}
        </Grid>
        <Grid item xs={9} sx={{ paddingLeft: '1rem' }}>
          <Typography component="p" sx={sxClasses.headline}>
            {layerKeys[selectedLayerIndex]}
          </Typography>

          <CircularProgress isLoaded={isLoading} style={{ marginTop: '1rem' }} />

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
