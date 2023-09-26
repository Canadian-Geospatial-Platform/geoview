import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Projection } from 'ol/proj';
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
} from '@/ui';
import MapDataTable, { MapDataTableData as MapDataTableDataProps } from './map-data-table';

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
  const [data, setData] = useState(layerData[0]);
  const layerKeyRef = useRef<string>(layerKeys[0]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);

  const handleListItemClick = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    setSelectedLayerIndex(index);
  }, []);

  /**
   * Render group layers as list.
   *
   * @returns JSX.Element
   */
  const renderList = useCallback(
    () => (
      <List sx={{ color: 'text.primary', marginLeft: '1rem', width: '100%', paddingRight: '2rem' }}>
        {layerKeys.map((layerKey, index) => (
          <Paper
            sx={{ marginBottom: '1rem', height: '67px', border: selectedLayerIndex === index ? '2px solid #515BA5' : 'none' }}
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
    layerKeyRef.current = layerKeys[selectedLayerIndex];
    setData(layerData[selectedLayerIndex]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayerIndex]);

  return (
    <Box sx={{ backgroundColor: '#F1F2F5', marginTop: '1rem' }}>
      <Grid container spacing={2} sx={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <Grid item xs={3}>
          <Typography component="p" sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
            Available Categories
          </Typography>
        </Grid>

        <Grid item xs={9}>
          <Typography component="p" sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
            Selected Category
          </Typography>
        </Grid>
      </Grid>
      <Grid container sx={{ marginTop: '0.75rem' }}>
        <Grid item xs={3}>
          {renderList()}
        </Grid>
        <Grid item xs={9} sx={{ paddingLeft: '1rem' }}>
          <Typography component="p" sx={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
            {layerKeys[selectedLayerIndex]}
          </Typography>

          {data.features.length ? (
            <MapDataTable
              data={data}
              layerId={layerIds[selectedLayerIndex]}
              mapId={mapId}
              layerKey={layerKeyRef.current}
              projectionConfig={projectionConfig}
            />
          ) : (
            'No Data'
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
