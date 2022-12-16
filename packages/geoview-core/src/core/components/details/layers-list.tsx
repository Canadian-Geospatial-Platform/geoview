/* eslint-disable react/require-default-props */
import React, { useState } from 'react';
// import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
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
import { TypeArrayOfLayerData } from './details';
import { FeatureInfo } from './feature-info';

const sxClasses = {
  details: {
    width: '100%',
  },
  layerItem: {
    color: 'text.primary',
    padding: 0,
  },
  expandableGroup: {
    paddingRight: 0,
    paddingLeft: 28,
  },
  expandableIconContainer: {
    paddingLeft: 10,
  },
  legendIcon: {
    width: 24,
    height: 24,
    background: '#fff',
  },
  solidBackground: {
    background: '#fff',
  },
};
interface TypeLayersListProps {
  arrayOfLayerData: TypeArrayOfLayerData;
}

/**
 * layers list
 *
 * @returns {JSX.Element} the layers list
 */
export function LayersList(props: TypeLayersListProps): JSX.Element {
  const { arrayOfLayerData } = props;
  // const { t, i18n } = useTranslation<string>();
  const [layerSetOpen, setLayerSetOpen] = useState<string>('');
  // const [layerOpen, setLayerOpen] = useState<string>('');

  return (
    <List sx={sxClasses.details}>
      {arrayOfLayerData.map((layerData) => {
        return (
          <div key={layerData.layerPath}>
            <ListItem
              sx={sxClasses.layerItem}
              onClick={() => setLayerSetOpen(layerSetOpen !== layerData.layerPath ? layerData.layerPath : '')}
            >
              <ListItemButton>
                <ListItemIcon>
                  <IconButton color="primary">{layerSetOpen !== layerData.layerPath ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>
                </ListItemIcon>
                <Tooltip title={layerData.layerPath} placement="top" enterDelay={1000}>
                  <ListItemText
                    primaryTypographyProps={{ fontSize: 14, noWrap: true }}
                    primary={layerData.layerPath ? layerData.layerName : 'Click on map'}
                  />
                </Tooltip>
              </ListItemButton>
            </ListItem>
            <Collapse in={layerSetOpen === layerData.layerPath} timeout="auto" unmountOnExit>
              <Box sx={sxClasses.expandableIconContainer}>
                {layerData.features.map((feature, index: number) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <FeatureInfo key={index} feature={feature} />
                ))}
              </Box>
            </Collapse>
          </div>
        );
      })}
    </List>
  );
}
