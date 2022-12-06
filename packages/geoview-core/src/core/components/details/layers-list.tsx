/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CloseIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  TodoIcon,
  ListAltIcon,
  Tooltip,
  VisibilityIcon,
  VisibilityOffIcon,
  IconButton,
} from '../../../ui';
import { TypeJsonObject } from '../../types/global-types';
import { FeatureInfo } from './feature-info';

const sxClasses = {
  details: {
    width: '100%',
    // maxWidth: 350, // for testing panel width
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

/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export function LayersList(props: TypeJsonObject): JSX.Element {
  const { layersData } = props;
  const { t, i18n } = useTranslation<string>();
  const [layerSetOpen, setLayerSetOpen] = useState<string>('');
  const [layerOpen, setLayerOpen] = useState<string>('');
  
  useEffect(() => {
    const layerSetIds = Object.keys(layersData);
    if (layerSetIds.length === 1) {
      setLayerSetOpen(layerSetIds[0]);
      const layerIds = Object.keys(layersData[layerSetIds[0]].layerData);
      if (layerIds.length === 1) {
        setLayerOpen(layerIds[0]);
      }
    }
  }, [layersData]);

  // useEffect(() => {
  //   if (layerConfigEntry) {
  //     rootGeoViewLayer.setVisible(isChecked, layerConfigEntry);
  //   } else {
  //     rootGeoViewLayer.setVisible(isChecked);
  //   }
  // }, [isChecked, layerConfigEntry, rootGeoViewLayer]);

  return (
    <List sx={sxClasses.details}>
      {
        // loop through each map server layer
        Object.keys(layersData).map((layerSetId) => {
          const {layerSetName, layerData} = layersData[layerSetId];

          return (
            <div key={layerSetId}>
            <ListItem sx={sxClasses.layerItem} onClick={() => setLayerSetOpen(layerSetOpen !== layerSetId? layerSetId : '')}>
              <ListItemButton>
              <Tooltip title={layerSetId} placement="top" enterDelay={1000}>
                <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={layerSetName} />
              </Tooltip>
              </ListItemButton>
            </ListItem>
            <Collapse in={layerSetOpen === layerSetId} timeout="auto" unmountOnExit>
            <Box>
              <Box sx={sxClasses.expandableIconContainer}>  
              {
                // loop through each layer in the map server
                Object.keys(layerData).map((layerId) => {
                  const { layerName, features } = layerData[layerId];

                  return (
                    <div key={layerId}>
                    <ListItem sx={sxClasses.layerItem} onClick={() => setLayerOpen(layerOpen !== layerId? layerId : '')}>
                      <ListItemButton>
                      <Tooltip title={layerId} placement="top" enterDelay={1000}>
                        <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={layerName} />
                      </Tooltip>
                      </ListItemButton>
                    </ListItem>
                    <Collapse in={layerOpen === layerId} timeout="auto" unmountOnExit>
                      <Box>
                        <Box sx={sxClasses.expandableIconContainer}>
                          {features.map((feature, index)=>{
                             return (
                              <FeatureInfo key={index} feature={feature} isOpen={false} />
                             )    
                          })}
                        </Box>
                      </Box>
                    </Collapse>
                    </div>
                  );
                })
              }
              </Box>
            </Box>
            </Collapse>
            </div>
          );
        })
      }
    </List>
  );

}
