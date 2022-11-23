/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import {
  Collapse,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CloseIcon,
  TodoIcon,
  Tooltip,
  VisibilityIcon,
  VisibilityOffIcon,
  IconButton,
  Menu,
  MenuItem,
  MoreVertIcon,
  ArrowRightIcon,
  ArrowDownIcon,
} from '../../../ui';
import {
  api,
  AbstractGeoViewLayer,
  TypeClassBreakStyleConfig,
  TypeListOfLayerEntryConfig,
  TypeUniqueValueStyleConfig,
  TypeLayerEntryConfig,
  TypeDisplayLanguage,
  MapContext,
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
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
    background: '#fff',
  },
  legendIconTransparent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  maxIconImg: {
    maxWidth: 24,
    maxHeight: 24,
  },
  iconPreview: {
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
  },
  iconImg: {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
  },
  iconPreviewHoverable: {
    left: -30,
    top: -2,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    transition: 'transform .3s ease-in-out',
    '&:hover': {
      transform: 'rotate(-18deg) translateX(-8px)',
    },
  },
  iconPreviewStacked: {
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
  },
  solidBackground: {
    background: '#fff',
  },
};

export interface TypeLegendItemProps {
  layerId: string;
  geoviewLayerInstance: AbstractGeoViewLayer;
  subLayerId?: string;
  layerConfigEntry?: TypeLayerEntryConfig;
  isRemoveable?: boolean;
}

/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export function LegendItem(props: TypeLegendItemProps): JSX.Element {
  const { layerId, geoviewLayerInstance, subLayerId, layerConfigEntry, isRemoveable } = props;

  const { t, i18n } = useTranslation<string>();

  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const [isChecked, setChecked] = useState(true);
  const [isGroupOpen, setGroupOpen] = useState(false);
  const [isLegendOpen, setLegendOpen] = useState(false);
  const [groupItems, setGroupItems] = useState<TypeListOfLayerEntryConfig>([]);
  const [iconType, setIconType] = useState<string | null>(null);
  const [iconImg, setIconImg] = useState<string | null>(null);
  const [iconImgStacked, setIconImgStacked] = useState<string | null>(null);
  const [iconList, setIconList] = useState<string[] | null>(null);
  const [labelList, setLabelList] = useState<string[] | null>(null);
  const [layerName, setLayerName] = useState<string>('');
  const [menuAnchorElement, setMenuAnchorElement] = React.useState<null | HTMLElement>(null);

  const menuOpen = Boolean(menuAnchorElement);

  const getGroupsDetails = (): boolean => {
    let isGroup = false;
    if (layerConfigEntry) {
      if (layerEntryIsGroupLayer(layerConfigEntry)) {
        setGroupItems(layerConfigEntry.listOfLayerEntryConfig);
        isGroup = true;
      }
    } else if (
      geoviewLayerInstance?.listOfLayerEntryConfig &&
      (geoviewLayerInstance?.listOfLayerEntryConfig.length > 1 || layerEntryIsGroupLayer(geoviewLayerInstance.listOfLayerEntryConfig[0]))
    ) {
      setGroupItems(geoviewLayerInstance.listOfLayerEntryConfig);
      isGroup = true;
    }
    return isGroup;
  };

  const getLegendDetails = () => {
    geoviewLayerInstance?.getLegend(subLayerId).then((layerLegend) => {
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
              if (iconImageList.length > 0) setIconImg(iconImageList[0]);
              if (iconImageList.length > 1) setIconImgStacked(iconImageList[1]);
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
    } else if (geoviewLayerInstance && geoviewLayerInstance.geoviewLayerName[i18n.language as TypeDisplayLanguage]) {
      setLayerName(geoviewLayerInstance.geoviewLayerName[i18n.language as TypeDisplayLanguage] ?? '');
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
    //         getLegendDetails(resultSets[`${layerId}/${geoviewLayerInstance.activeLayer.layerId}`]);
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
      geoviewLayerInstance.setVisible(isChecked, layerConfigEntry);
    } else {
      const setVisibleOnAllLayers = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig) => {
        listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          geoviewLayerInstance.setVisible(isChecked, layerEntryConfig);
          if (layerEntryIsGroupLayer(layerEntryConfig)) setVisibleOnAllLayers(layerEntryConfig.listOfLayerEntryConfig);
        });
      };
      setVisibleOnAllLayers(geoviewLayerInstance.listOfLayerEntryConfig);
    }
  }, [isChecked, layerConfigEntry, geoviewLayerInstance]);

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = () => {
    setGroupOpen(!isGroupOpen);
  };

  /**
   * Handle expand/shrink of legends.
   */
  const handleLegendClick = () => {
    setLegendOpen(!isLegendOpen);
  };

  /**
   * Handle view/hide layers.
   */
  const handleToggleLayer = () => {
    setChecked(!isChecked);
  };

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorElement(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setMenuAnchorElement(null);
  };
  const handleRemoveLayer = () => {
    api.map(mapId).layer.removeGeoviewLayer(geoviewLayerInstance);
    // NOTE: parent component needs to deal with removing this legend-item when recieving the layer remove event
    handleCloseMenu();
  };

  return (
    <>
      <ListItem sx={sxClasses.legendItem}>
        <ListItemButton>
          <ListItemIcon>
            {groupItems.length > 0 && (
              <IconButton color="primary" onClick={handleExpandGroupClick}>
                {isGroupOpen ? <ArrowDownIcon /> : <ArrowRightIcon />}
              </IconButton>
            )}
            {isLegendOpen && (
              <IconButton sx={sxClasses.iconPreview} color="primary" size="small" onClick={handleLegendClick}>
                <CloseIcon />
              </IconButton>
            )}
            {iconType === 'simple' && iconImg !== null && !isLegendOpen && (
              <IconButton sx={sxClasses.iconPreview} color="primary" size="small" onClick={handleLegendClick}>
                <Box sx={sxClasses.legendIcon}>
                  <img alt="icon" src={iconImg} style={sxClasses.maxIconImg} />
                </Box>
              </IconButton>
            )}
            {iconType === 'list' && !isLegendOpen && (
              <Tooltip title={t('legend.expand_legend')} placement="top" enterDelay={1000}>
                <Box>
                  <IconButton sx={sxClasses.iconPreviewStacked} color="primary" size="small">
                    <Box sx={sxClasses.legendIconTransparent}>
                      {iconImgStacked && <img alt="icon" src={iconImgStacked} style={sxClasses.maxIconImg} />}
                    </Box>
                  </IconButton>
                  <IconButton sx={sxClasses.iconPreviewHoverable} color="primary" size="small" onClick={handleLegendClick}>
                    <Box sx={sxClasses.legendIcon}>{iconImg && <img alt="icon" src={iconImg} style={sxClasses.maxIconImg} />}</Box>
                  </IconButton>
                </Box>
              </Tooltip>
            )}
            {groupItems.length === 0 && !iconType && !isLegendOpen && (
              <IconButton sx={sxClasses.iconPreview} color="primary" size="small" onClick={handleLegendClick}>
                <TodoIcon />
              </IconButton>
            )}
          </ListItemIcon>
          <Tooltip title={layerName} placement="top" enterDelay={1000}>
            <ListItemText primaryTypographyProps={{ fontSize: 14, noWrap: true }} primary={layerName} />
          </Tooltip>
          <ListItemIcon>
            {isRemoveable && (
              <IconButton onClick={handleMoreClick}>
                <MoreVertIcon />
              </IconButton>
            )}
            <IconButton color="primary" onClick={() => handleToggleLayer()}>
              {isChecked ? <VisibilityIcon /> : <VisibilityOffIcon />}
            </IconButton>
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Menu anchorEl={menuAnchorElement} open={menuOpen} onClose={handleCloseMenu}>
        {/* Add more layer options here - transparency, zoom to, reorder */}
        {isRemoveable && <MenuItem onClick={handleRemoveLayer}>{t('legend.remove_layer')}</MenuItem>}
      </Menu>
      <Collapse in={isLegendOpen} timeout={iconType === 'list' ? { enter: 800, exit: 800 } : 'auto'}>
        <Box>
          <Box sx={sxClasses.expandableIconContainer}>
            {iconType === 'simple' && iconImg !== null && (
              <img alt="" style={{ ...sxClasses.solidBackground, ...sxClasses.iconImg }} src={iconImg} />
            )}
            {iconType === 'list' && iconList !== null && labelList !== null && (
              <LegendIconList iconImages={iconList} iconLabels={labelList} />
            )}
          </Box>
        </Box>
      </Collapse>
      <Collapse in={isGroupOpen} timeout="auto">
        <Box>
          <Box sx={sxClasses.expandableIconContainer}>
            {groupItems.map((subItem) => (
              <LegendItem
                key={`sub-${subItem.layerId}`}
                layerId={layerId}
                geoviewLayerInstance={geoviewLayerInstance}
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
