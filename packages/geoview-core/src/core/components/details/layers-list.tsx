/* eslint-disable prettier/prettier */
/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ExpandMoreIcon,
  ExpandLessIcon,
  Tooltip,
  IconButton,
} from '../../../ui';
import { TypeArrayOfLayerData, DetailsProps } from './details';
import { FeatureInfo } from './feature-info';

const sxClasses = {
  expandableIconContainer: {},
};
interface TypeLayersListProps {
  arrayOfLayerData: TypeArrayOfLayerData;
  detailsSettings: DetailsProps;
}

/**
 * layers list
 *
 * @returns {JSX.Element} the layers list
 */
export function LayersList(props: TypeLayersListProps): JSX.Element {
  const { arrayOfLayerData, detailsSettings } = props;
  const [layerSetOpen, setLayerSetOpen] = useState<string>('');

  useEffect(() => {
    // if there is only one layer in the list, open it
    if (arrayOfLayerData.length === 1) {
      setLayerSetOpen(arrayOfLayerData[0].layerPath);
    } else {
      setLayerSetOpen('');
    }
  }, [arrayOfLayerData]);

  return (
    <List sx={{ color: 'text.primary' }}>
      {arrayOfLayerData.map((layerData) => {
        return (
          <div key={layerData.layerPath}>
            <ListItem
              onClick={() => setLayerSetOpen(layerSetOpen !== layerData.layerPath ? layerData.layerPath : '')}
              sx={{ padding: '8px 0' }}
            >
              <ListItemButton>
                <ListItemIcon>
                  <IconButton color="primary">{layerSetOpen === layerData.layerPath ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                </ListItemIcon>
                <Tooltip title={layerData.layerPath} placement="top" enterDelay={1000}>
                  <ListItemText primary={layerData.layerPath ? layerData.layerName : 'Click on map'} />
                </Tooltip>
              </ListItemButton>
            </ListItem>
            <Collapse in={layerSetOpen === layerData.layerPath} timeout="auto" unmountOnExit>
              <Grid container spacing={2} sx={sxClasses.expandableIconContainer}>
                {layerData.features.map((feature, index: number) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Grid key={index} item sm={12} md={detailsSettings.singleColumn ? 12 : 6} lg={detailsSettings.singleColumn ? 12 : 4}>
                    <FeatureInfo feature={feature} startOpen={layerData.features.length === 1} detailsSettings={detailsSettings} />
                  </Grid>
                ))}
              </Grid>
            </Collapse>
          </div>
        );
      })}
    </List>
  );
}
