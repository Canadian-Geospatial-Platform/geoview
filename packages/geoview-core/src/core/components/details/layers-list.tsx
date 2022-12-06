/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
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
import { TypeJsonObject } from '../../types/global-types';
import { TypeLayerSetData } from './details';
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
  layersData: Record<string, TypeLayerSetData>;
}

/**
 * layers list
 *
 * @returns {JSX.Element} the layers list
 */
export function LayersList(props: TypeLayersListProps): JSX.Element {
  const { layersData } = props;
  // const { t, i18n } = useTranslation<string>();
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

  return (
    <List sx={sxClasses.details}>
      {
        // loop through each map server layer
        Object.keys(layersData).map((layerSetId) => {
          const { layerSetName, layerData } = layersData[layerSetId];

          return (
            <div key={layerSetId}>
              <ListItem sx={sxClasses.layerItem} onClick={() => setLayerSetOpen(layerSetOpen !== layerSetId ? layerSetId : '')}>
                <ListItemButton>
                  <ListItemIcon>
                    <IconButton color="primary">{layerSetOpen !== layerSetId ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>
                    {/* {iconType === 'simple' && iconImg !== null && (
                      <Avatar sx={sxClasses.legendIcon} variant="square" src={isLegendOpen ? '' : iconImg} onClick={() => handleLegendClick()}>
                        <CloseIcon />
                      </Avatar>
                    )}
                    {iconType === 'list' && (
                      <Avatar sx={sxClasses.legendIcon} variant="square" onClick={() => handleLegendClick()}>
                        {isLegendOpen ? <CloseIcon /> : <ListAltIcon />}
                      </Avatar>
                    )}
                    {groupItems.length === 0 && !iconType && (
                      <Avatar sx={sxClasses.legendIcon} variant="square" onClick={() => handleLegendClick()}>
                        <TodoIcon />
                      </Avatar>
                    )} */}
                  </ListItemIcon>
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
                            <ListItem
                              sx={sxClasses.layerItem}
                              onClick={() => setLayerOpen(layerSetOpen !== layerSetId || layerOpen !== layerId ? layerId : '')}
                            >
                              <ListItemButton>
                                <ListItemIcon>
                                  <IconButton color="primary">
                                    {layerSetOpen !== layerSetId || layerOpen !== layerId ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                  </IconButton>
                                </ListItemIcon>
                                <Tooltip title={layerId} placement="top" enterDelay={1000}>
                                  <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={layerName} />
                                </Tooltip>
                              </ListItemButton>
                            </ListItem>
                            <Collapse in={layerOpen === layerId} timeout="auto" unmountOnExit>
                              <Box>
                                <Box sx={sxClasses.expandableIconContainer}>
                                  {Array.isArray(features) &&
                                    features.map((feature: TypeJsonObject, index: number) => {
                                      // eslint-disable-next-line react/no-array-index-key
                                      return <FeatureInfo key={index} feature={feature} />;
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
