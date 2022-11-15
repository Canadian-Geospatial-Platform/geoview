/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import {
  Avatar,
  Collapse,
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
import {
  AbstractGeoViewLayer,
  TypeClassBreakStyleConfig,
  TypeListOfLayerEntryConfig,
  TypeUniqueValueStyleConfig,
  TypeLayerEntryConfig,
  TypeDisplayLanguage,
} from '../../../app';
import { LegendIconList } from './legend-icon-list';
import { isVectorLegend, isWmsLegend } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';
import { isClassBreakStyleConfig, isUniqueValueStyleConfig, layerEntryIsGroupLayer } from '../../../geo/map/map-schema-types';

const sxClasses = {
  legendItem: {
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

export interface TypeLegendItemProps {
  layerId: string;
  rootGeoViewLayer: AbstractGeoViewLayer;
  subLayerId?: string;
  layerConfigEntry?: TypeLayerEntryConfig;
}

/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export function LegendItem(props: TypeLegendItemProps): JSX.Element {
  const { layerId, rootGeoViewLayer, subLayerId, layerConfigEntry } = props;

  const { t, i18n } = useTranslation<string>();

  const [isChecked, setChecked] = useState(true);
  const [isGroupOpen, setGroupOpen] = useState(false);
  const [isLegendOpen, setLegendOpen] = useState(false);
  const [groupItems, setGroupItems] = useState<TypeListOfLayerEntryConfig>([]);
  const [iconType, setIconType] = useState<string | null>(null);
  const [iconImg, setIconImg] = useState<string | null>(null);
  const [iconList, setIconList] = useState<string[] | null>(null);
  const [labelList, setLabelList] = useState<string[] | null>(null);
  const [layerName, setLayerName] = useState<string>('');

  const getGroupsDetails = (): boolean => {
    let isGroup = false;
    if (layerConfigEntry) {
      if (layerEntryIsGroupLayer(layerConfigEntry)) {
        setGroupItems(layerConfigEntry.listOfLayerEntryConfig);
        isGroup = true;
      }
    } else if (
      rootGeoViewLayer?.listOfLayerEntryConfig &&
      (rootGeoViewLayer?.listOfLayerEntryConfig.length > 1 || layerEntryIsGroupLayer(rootGeoViewLayer.listOfLayerEntryConfig[0]))
    ) {
      setGroupItems(rootGeoViewLayer.listOfLayerEntryConfig);
      isGroup = true;
    }
    return isGroup;
  };

  const getLegendDetails = () => {
    rootGeoViewLayer?.getLegend(subLayerId).then((layerLegend) => {
      if (layerLegend) {
        // WMS layers just return a string
        if (isWmsLegend(layerLegend)) {
          setIconType('simple');
          setIconImg(layerLegend.legend.toDataURL());
        } else if (isVectorLegend(layerLegend)) {
          Object.entries(layerLegend.legend).forEach(([, styleRepresentation]) => {
            if (styleRepresentation.arrayOfCanvas) {
              setIconType('list');
              const iconImageList = (styleRepresentation.arrayOfCanvas as HTMLCanvasElement[]).map((canvas) => {
                return canvas.toDataURL();
              });
              if (styleRepresentation.defaultCanvas) iconImageList.push(styleRepresentation.defaultCanvas.toDataURL());
              setIconList(iconImageList);
              if (layerLegend.styleConfig) {
                Object.entries(layerLegend.styleConfig).forEach(([, styleSettings]) => {
                  if (isClassBreakStyleConfig(styleSettings)) {
                    const iconLabelList = (styleSettings as TypeClassBreakStyleConfig).classBreakStyleInfos.map((styleInfo) => {
                      return styleInfo.label;
                    });
                    if (styleRepresentation.defaultCanvas) iconLabelList.push((styleSettings as TypeClassBreakStyleConfig).defaultLabel!);
                    setLabelList(iconLabelList);
                  }
                  if (isUniqueValueStyleConfig(styleSettings)) {
                    const iconLabelList = (styleSettings as TypeUniqueValueStyleConfig).uniqueValueStyleInfo.map((styleInfo) => {
                      return styleInfo.label;
                    });
                    if (styleRepresentation.defaultCanvas) iconLabelList.push((styleSettings as TypeUniqueValueStyleConfig).defaultLabel!);
                    setLabelList(iconLabelList);
                  }
                });
              }
            } else {
              setIconType('simple');
              setIconImg((styleRepresentation.defaultCanvas as HTMLCanvasElement).toDataURL());
            }
          });
        } else {
          // eslint-disable-next-line no-console
          console.log(`${layerId} - UNHANDLED LEGEND TYPE`);
        }
      } else {
        // eslint-disable-next-line no-console
        console.log(`${layerId} - NULL LAYER DATA`);
      }
    });
  };

  const getLayerName = () => {
    if (layerConfigEntry) {
      if (layerConfigEntry.layerName && layerConfigEntry.layerName[i18n.language as TypeDisplayLanguage]) {
        setLayerName(layerConfigEntry.layerName[i18n.language as TypeDisplayLanguage] ?? '');
      } else if (t('legend.unknown')) {
        setLayerName(t('legend.unknown'));
      }
    } else if (rootGeoViewLayer && rootGeoViewLayer.geoviewLayerName[i18n.language as TypeDisplayLanguage]) {
      setLayerName(rootGeoViewLayer.geoviewLayerName[i18n.language as TypeDisplayLanguage] ?? '');
    } else if (t('legend.unknown')) {
      setLayerName(t('legend.unknown'));
    }
  };

  useEffect(() => {
    // TODO EVENT OPTION 1 - Issue #615 not efficient becuase it gets all legends for a single legend item, have to match up geolayerView with layerPath in resultSet
    // const legendLayerSet = api.createLegendsLayerSet(mapId, 'wmsLegendsId');
    // api.event.on(
    //   api.eventNames.GET_LEGENDS.ALL_LEGENDS_DONE,
    //   (payload) => {
    //     if (payloadIsAllLegendsDone(payload)) {
    //       api.event.off(api.eventNames.GET_LEGENDS.ALL_LEGENDS_DONE, mapId);
    //       const { layerSetId, resultSets } = payload;
    //       if (subLayerId) {
    //         getLegendDetails(resultSets[`${subLayerId}`]);
    //       } else {
    //         getLegendDetails(resultSets[`${layerId}/${rootGeoViewLayer.activeLayer.layerId}`]);
    //       }
    //     }
    //   },
    //   mapId
    // );
    // api.event.emit(GetLegendsPayload.createTriggerLegendPayload(mapId, layerId));

    // TODO EVENT OPTION 2 - Issue #615 trying to get individual legend info, but this only works when handler=mapId so its the same as option 1
    // api.event.on(
    //   api.eventNames.GET_LEGENDS.LEGEND_INFO,
    //   (payload) => {
    //     api.event.off(api.eventNames.GET_LEGENDS.LEGEND_INFO, mapId);
    //     getLegendDetails(payload.legendInfo);
    //   },
    //   mapId
    // );
    // api.event.emit({ handlerName: mapId, event: api.eventNames.GET_LEGENDS.QUERY_LEGEND, layerPath: layerId });
    getLayerName();
    const isGroup = getGroupsDetails();
    if (!isGroup) {
      getLegendDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (layerConfigEntry) {
      rootGeoViewLayer.setVisible(isChecked, layerConfigEntry);
    } else {
      rootGeoViewLayer.setVisible(isChecked);
    }
  }, [isChecked, layerConfigEntry, rootGeoViewLayer]);

  const handleExpandClick = () => {
    setGroupOpen(!isGroupOpen);
  };

  const handleLegendClick = () => {
    setLegendOpen(!isLegendOpen);
  };

  const handleToggleLayer = () => {
    setChecked(!isChecked);
  };

  return (
    <>
      <ListItem sx={sxClasses.legendItem}>
        <ListItemButton>
          <ListItemIcon>
            {groupItems.length > 0 && (
              <IconButton color="primary" onClick={handleExpandClick}>
                {isGroupOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            )}
            {iconType === 'simple' && iconImg !== null && (
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
            )}
          </ListItemIcon>
          <Tooltip title={layerName} placement="top" enterDelay={1000}>
            <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={layerName} />
          </Tooltip>
          <ListItemIcon>
            <IconButton color="primary" onClick={() => handleToggleLayer()}>
              {isChecked ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Collapse in={isLegendOpen} timeout="auto" unmountOnExit>
        <Box>
          <Box sx={sxClasses.expandableIconContainer}>
            {iconType === 'simple' && iconImg !== null && <img alt="" style={sxClasses.solidBackground} src={iconImg} />}
            {iconType === 'list' && iconList !== null && labelList !== null && (
              <LegendIconList iconImages={iconList} iconLabels={labelList} />
            )}
          </Box>
        </Box>
      </Collapse>
      <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
        <Box>
          <Box sx={sxClasses.expandableIconContainer}>
            {groupItems.map((subItem) => (
              <LegendItem
                key={`sub-${subItem.layerId}`}
                layerId={layerId}
                rootGeoViewLayer={rootGeoViewLayer}
                subLayerId={subLayerId ? `${subLayerId}/${subItem.layerId}` : `${layerId}/${subItem.layerId}`}
                layerConfigEntry={subItem}
              />
            ))}
          </Box>
        </Box>
      </Collapse>
    </>
  );
}
