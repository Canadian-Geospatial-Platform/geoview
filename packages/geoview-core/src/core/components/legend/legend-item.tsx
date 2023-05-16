/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useRef, MutableRefObject, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { Extent } from 'ol/extent';
import {
  Box,
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
  ExpandMoreIcon,
  ExpandLessIcon,
  OpacityIcon,
  SliderBase,
  CheckIcon,
  MoreHorizIcon,
  BrowserNotSupportedIcon,
} from '../../../ui';
import { api, EsriDynamic, payloadIsLegendInfo, NumberPayload, PayloadBaseClass } from '../../../app';
import { LegendIconList } from './legend-icon-list';
import {
  AbstractGeoViewLayer,
  TypeLegend,
  isVectorLegend,
  isWmsLegend,
  isImageStaticLegend,
} from '../../../geo/layer/geoview-layers/abstract-geoview-layers';
import {
  TypeClassBreakStyleConfig,
  TypeListOfLayerEntryConfig,
  TypeUniqueValueStyleConfig,
  TypeLayerEntryConfig,
  TypeDisplayLanguage,
  TypeVectorLayerEntryConfig,
  TypeStyleGeometry,
  TypeVectorSourceInitialConfig,
  isClassBreakStyleConfig,
  isUniqueValueStyleConfig,
  layerEntryIsGroupLayer,
} from '../../../geo/map/map-schema-types';
import { AbstractGeoViewVector } from '../../../geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { disableScrolling } from '../../utils/utilities';

const sxClasses = {
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
    marginLeft: 8,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'palette.grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    '&:focus': {
      border: 'revert',
    },
  },
  stackIconsBox: {
    position: 'relative',
    marginLeft: 8,
    '&:focus': {
      outlineColor: 'grey',
    },
  },
  iconPreviewHoverable: {
    position: 'absolute',
    left: -3,
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
    // marginLeft: 8,
    padding: 0,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
  },
  opacityMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '0 62px 16px 62px',
  },
  menuListIcon: { justifyContent: 'right', 'min-width': '56px' },
};

export interface TypeLegendItemProps {
  layerId: string;
  geoviewLayerInstance: AbstractGeoViewLayer;
  subLayerId?: string;
  layerConfigEntry?: TypeLayerEntryConfig;
  isRemoveable?: boolean;
  canSetOpacity?: boolean;
  isParentVisible?: boolean;
  toggleParentVisible?: () => void;
  expandAll?: boolean;
  hideAll?: boolean;
  canZoomTo?: boolean;
}

/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export function LegendItem(props: TypeLegendItemProps): JSX.Element {
  const {
    layerId,
    geoviewLayerInstance,
    subLayerId,
    layerConfigEntry,
    isRemoveable,
    canSetOpacity,
    isParentVisible,
    toggleParentVisible,
    expandAll,
    hideAll,
    canZoomTo,
  } = props;

  const { t, i18n } = useTranslation<string>();
  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  const { mapId } = geoviewLayerInstance;
  // check if layer is a clustered, so that clustering can be toggled
  const path = subLayerId || `${layerId}/${geoviewLayerInstance.activeLayer?.layerId}`;
  const clusterLayerPath = path.replace('-unclustered', '');
  const unclusterLayerPath = `${clusterLayerPath}-unclustered`;
  const canCluster = !!api.maps[mapId].layer.registeredLayers[unclusterLayerPath];

  const [isClusterToggleEnabled, setIsClusterToggleEnabled] = useState(false);
  const [isChecked, setChecked] = useState(true);
  const [isOpacityOpen, setOpacityOpen] = useState(false);
  const [isGroupOpen, setGroupOpen] = useState(true);
  const [isLegendOpen, setLegendOpen] = useState(true);
  const [groupItems, setGroupItems] = useState<TypeListOfLayerEntryConfig>([]);
  const [iconType, setIconType] = useState<string | null>(null);
  const [iconImg, setIconImg] = useState<string | null>(null);
  const [iconImgStacked, setIconImgStacked] = useState<string | null>(null);
  const [iconList, setIconList] = useState<string[] | null>(null);
  const [labelList, setLabelList] = useState<string[] | null>(null);
  const [geometryLayerConfig, setLayerConfig] = useState<TypeLayerEntryConfig | null>(null);
  const [layerGeometryKey, setGeometryKey] = useState<TypeStyleGeometry | undefined>(undefined);
  const [layerName, setLayerName] = useState<string>('');
  const [menuAnchorElement, setMenuAnchorElement] = useState<null | HTMLElement>(null);
  const [opacity, setOpacity] = useState<number>(1);
  const [zoomToExtent, setZoomtoExtent] = useState<Extent | undefined>();

  const [zoom, setZoom] = useState<number>(api.map(mapId).currentZoom);
  const splitZoom =
    (api.map(mapId).layer.registeredLayers[clusterLayerPath]?.source as TypeVectorSourceInitialConfig)?.cluster?.splitZoom || 7;
  const closeIconRef = useRef() as RefObject<HTMLButtonElement>;
  const stackIconRef = useRef() as MutableRefObject<HTMLDivElement | undefined>;
  const maxIconRef = useRef() as RefObject<HTMLButtonElement>;
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
      (geoviewLayerInstance?.listOfLayerEntryConfig.length > 1 || layerEntryIsGroupLayer(geoviewLayerInstance?.listOfLayerEntryConfig[0]))
    ) {
      setGroupItems(geoviewLayerInstance?.listOfLayerEntryConfig);
      isGroup = true;
    }
    return isGroup;
  };

  const getLegendDetails = (layerLegend: TypeLegend) => {
    const { geoviewLayerId } = geoviewLayerInstance;
    if (layerLegend) {
      if (layerLegend.legend === null) setIconImg('no data');
      // WMS layers just return a string
      if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        setIconType('simple');
        if (layerLegend.legend) setIconImg(layerLegend.legend?.toDataURL());
      } else if (isVectorLegend(layerLegend) && layerLegend.legend) {
        Object.entries(layerLegend.legend).forEach(([, styleRepresentation]) => {
          if (styleRepresentation.arrayOfCanvas) {
            setIconType('list');
            const iconImageList = (styleRepresentation.arrayOfCanvas as HTMLCanvasElement[]).map((canvas) => {
              return canvas.toDataURL();
            });
            if (iconImageList.length > 0) setIconImg(iconImageList[0]);
            if (iconImageList.length > 1) setIconImgStacked(iconImageList[1]);
            if (styleRepresentation.defaultCanvas) iconImageList.push(styleRepresentation.defaultCanvas.toDataURL());
            if (styleRepresentation.clusterCanvas) iconImageList.push(styleRepresentation.clusterCanvas.toDataURL());
            setIconList(iconImageList);
            if (layerLegend.styleConfig) {
              let geometryKey: TypeStyleGeometry | null = null;
              Object.entries(layerLegend.styleConfig).forEach(([key, styleSettings]) => {
                if (isClassBreakStyleConfig(styleSettings)) {
                  const iconLabelList = (styleSettings as TypeClassBreakStyleConfig).classBreakStyleInfo.map((styleInfo) => {
                    return styleInfo.label;
                  });
                  if (styleRepresentation.defaultCanvas) iconLabelList.push((styleSettings as TypeClassBreakStyleConfig).defaultLabel!);
                  if (styleRepresentation.clusterCanvas) iconLabelList.push('Cluster');
                  setLabelList(iconLabelList);
                  geometryKey = key as TypeStyleGeometry;
                }
                if (isUniqueValueStyleConfig(styleSettings)) {
                  const iconLabelList = (styleSettings as TypeUniqueValueStyleConfig).uniqueValueStyleInfo.map((styleInfo) => {
                    return styleInfo.label;
                  });
                  if (styleRepresentation.defaultCanvas) iconLabelList.push((styleSettings as TypeUniqueValueStyleConfig).defaultLabel!);
                  if (styleRepresentation.clusterCanvas) iconLabelList.push('Cluster');
                  setLabelList(iconLabelList);
                  geometryKey = key as TypeStyleGeometry;
                }
              });

              Object.keys(api.map(mapId).layer.registeredLayers).forEach((layerPath) => {
                if (layerPath.startsWith(geoviewLayerId)) {
                  const layerConfig = api.map(mapId).layer.registeredLayers[layerPath] as TypeVectorLayerEntryConfig;
                  if (layerConfig && layerConfig.style && geometryKey) {
                    const geometryStyle = layerConfig.style[geometryKey as TypeStyleGeometry];
                    if (
                      geometryStyle !== undefined &&
                      (geometryStyle.styleType === 'uniqueValue' || geometryStyle.styleType === 'classBreaks')
                    ) {
                      setGeometryKey(geometryKey);
                      setLayerConfig(layerConfig);
                    }
                  }
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
  };

  const getLayerName = () => {
    if (layerConfigEntry) {
      if (layerConfigEntry.layerName && layerConfigEntry.layerName[i18n.language as TypeDisplayLanguage]) {
        setLayerName(layerConfigEntry.layerName[i18n.language as TypeDisplayLanguage] ?? '');
      } else if (t('legend.unknown')) {
        setLayerName(t('legend.unknown')!);
      }
    } else if (geoviewLayerInstance?.geoviewLayerName[i18n.language as TypeDisplayLanguage]) {
      setLayerName(geoviewLayerInstance.geoviewLayerName[i18n.language as TypeDisplayLanguage] ?? '');
    } else if (t('legend.unknown')) {
      setLayerName(t('legend.unknown')!);
    }
  };

  useEffect(() => {
    getLayerName();
    const isGroup = getGroupsDetails();
    if (!isGroup) {
      setOpacity(geoviewLayerInstance.getOpacity() ?? 1);
      const legendInfo = api.maps[mapId].legend.legendLayerSet.resultSets[path];
      if (legendInfo) {
        getLegendDetails(legendInfo);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  api.event.on(
    api.eventNames.GET_LEGENDS.LEGEND_INFO,
    (payload) => {
      if (payloadIsLegendInfo(payload)) {
        const { layerPath, legendInfo } = payload;
        if (!getGroupsDetails() && legendInfo) {
          if (path === layerPath) {
            getLegendDetails(legendInfo);
          }
        }
      }
    },
    mapId
  );

  useEffect(() => {
    if (expandAll !== undefined) setGroupOpen(expandAll);
  }, [expandAll]);

  useEffect(() => {
    if (hideAll !== undefined) setChecked(!hideAll);
  }, [hideAll]);

  // TODO ! Revise this useEffect because it prevent the visibility flag of the config to work properly.
  useEffect(() => {
    if (layerConfigEntry) {
      if (isParentVisible && isChecked) {
        geoviewLayerInstance.setVisible(true, layerConfigEntry);
      } else {
        geoviewLayerInstance.setVisible(false, layerConfigEntry);
      }
    } else {
      // parent layer with no sub layers
      geoviewLayerInstance.setVisible(isChecked);
    }
  }, [isParentVisible, isChecked, layerConfigEntry, geoviewLayerInstance]);

  useEffect(() => {
    const mapZoomHandler = (payload: PayloadBaseClass) => {
      if (canCluster) {
        setZoom((payload as NumberPayload).value);
      }
    };
    api.event.on(api.eventNames.MAP.EVENT_MAP_ZOOM_END, mapZoomHandler, mapId);
    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_ZOOM_END, mapId);
    };
  }, [canCluster, mapId]);

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
    if (isParentVisible !== undefined) {
      if (toggleParentVisible !== undefined && isParentVisible === false) {
        toggleParentVisible();
        if (!isChecked) setChecked(!isChecked);
        return;
      }
    }
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

  const handleOpacityOpen = () => {
    setOpacityOpen(!isOpacityOpen);
    handleCloseMenu();
  };

  const handleSetOpacity = (opacityValue: number | number[]) => {
    if (!geoviewLayerInstance) return;
    if (canCluster) {
      geoviewLayerInstance.setOpacity((opacityValue as number) / 100, clusterLayerPath);
      geoviewLayerInstance.setOpacity((opacityValue as number) / 100, unclusterLayerPath);
    } else if (subLayerId) geoviewLayerInstance.setOpacity((opacityValue as number) / 100, subLayerId);
    else geoviewLayerInstance.setOpacity((opacityValue as number) / 100);
  };

  const handleClusterToggle = () => {
    if (api.map(mapId).layer.registeredLayers[clusterLayerPath]?.gvLayer) {
      api
        .map(mapId)
        .layer.registeredLayers[clusterLayerPath]?.gvLayer!.setVisible(
          !api.map(mapId).layer.registeredLayers[clusterLayerPath]?.gvLayer!.getVisible()
        );
      api
        .map(mapId)
        .layer.registeredLayers[unclusterLayerPath]?.gvLayer!.setVisible(
          !api.map(mapId).layer.registeredLayers[unclusterLayerPath]?.gvLayer!.getVisible()
        );
    }
    setIsClusterToggleEnabled(!isClusterToggleEnabled);
  };

  const handleStackIcon = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      handleLegendClick();
    }
  };

  const handleZoomTo = () => {
    api.map(mapId).zoomToExtent(zoomToExtent!);
    handleCloseMenu();
  };

  useEffect(() => {
    document.addEventListener('keydown', (e) => disableScrolling(e, stackIconRef));
    return () => {
      document.removeEventListener('keydown', (e) => disableScrolling(e, stackIconRef));
    };
  }, []);

  useEffect(() => {
    if (isLegendOpen && closeIconRef?.current) {
      closeIconRef.current?.focus();
    } else if (!isLegendOpen && stackIconRef?.current) {
      stackIconRef.current.focus();
    } else if (!isLegendOpen && iconType === 'simple' && maxIconRef?.current) {
      maxIconRef.current.focus();
    }
  }, [isLegendOpen, iconType]);

  // close the legend when no child.
  useEffect(() => {
    if (iconType === 'simple' && (!iconList || !iconList.length)) {
      setLegendOpen(false);
    }
  }, [iconList, iconType]);

  useEffect(() => {
    const source = (api.map(mapId).layer.getGeoviewLayerById(layerId) as AbstractGeoViewVector)?.activeLayer
      ?.source as TypeVectorSourceInitialConfig;
    setIsClusterToggleEnabled(source?.cluster?.enable ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const layerPath = api.maps[mapId].legend.legendLayerSet.resultSets[path]?.layerPath;
    const geoLayer = api.map(mapId).layer.getGeoviewLayerById(layerId) as AbstractGeoViewVector;
    const { activeLayer } = geoLayer;

    const bounds = activeLayer ? geoLayer.calculateBounds() : geoLayer.calculateBounds(layerPath);
    if (bounds) {
      setZoomtoExtent(bounds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid item sm={12} md={subLayerId ? 12 : 6} lg={subLayerId ? 12 : 4}>
      <ListItem>
        <ListItemButton>
          <ListItemIcon>
            {groupItems.length > 0 && (
              <IconButton color="primary" onClick={handleExpandGroupClick}>
                {isGroupOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            )}
            {groupItems.length === 0 && isLegendOpen && (
              <IconButton
                sx={sxClasses.iconPreview}
                color="primary"
                size="small"
                onClick={iconImg === null ? undefined : handleLegendClick}
                iconRef={closeIconRef}
              >
                {iconList || iconImg !== null ? <CloseIcon /> : <MoreHorizIcon />}
              </IconButton>
            )}
            {iconType === 'simple' && iconImg !== null && !isLegendOpen && (
              <IconButton
                sx={sxClasses.iconPreview}
                color="primary"
                size="small"
                iconRef={maxIconRef}
                onClick={iconImg === 'no data' ? undefined : handleLegendClick}
              >
                {iconImg === 'no data' ? (
                  <BrowserNotSupportedIcon />
                ) : (
                  <Box sx={sxClasses.legendIcon}>
                    <img alt="icon" src={iconImg} style={sxClasses.maxIconImg} />
                  </Box>
                )}
              </IconButton>
            )}
            {iconType === 'list' && !isLegendOpen && (
              <Tooltip title={t('legend.expand_legend')!} placement="top" enterDelay={1000}>
                <Box
                  tabIndex={0}
                  onClick={handleLegendClick}
                  sx={sxClasses.stackIconsBox}
                  ref={stackIconRef}
                  onKeyPress={(e) => handleStackIcon(e)}
                >
                  <IconButton sx={sxClasses.iconPreviewStacked} color="primary" size="small" tabIndex={-1}>
                    <Box sx={sxClasses.legendIconTransparent}>
                      {iconImgStacked && <img alt="icon" src={iconImgStacked} style={sxClasses.maxIconImg} />}
                    </Box>
                  </IconButton>
                  <IconButton sx={sxClasses.iconPreviewHoverable} color="primary" size="small" tabIndex={-1}>
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
            <ListItemText primary={layerName} onClick={handleExpandGroupClick} />
          </Tooltip>
          <ListItemIcon style={{ justifyContent: 'right' }}>
            {(isRemoveable || (canSetOpacity && groupItems.length === 0)) && (
              <IconButton id="setOpacityBtn" onClick={handleMoreClick} aria-label="more" aria-haspopup="true">
                <MoreVertIcon />
              </IconButton>
            )}
            <IconButton color="primary" onClick={() => handleToggleLayer()}>
              {(() => {
                if (isParentVisible === false) return <VisibilityOffIcon />;
                if (isChecked) return <VisibilityIcon />;
                return <VisibilityOffIcon />;
              })()}
            </IconButton>
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Menu
        anchorEl={menuAnchorElement}
        open={menuOpen}
        onClose={handleCloseMenu}
        MenuListProps={{
          'aria-labelledby': 'setOpacityBtn',
        }}
        disablePortal
      >
        {/* Add more layer options here - zoom to, reorder */}
        {isRemoveable && <MenuItem onClick={handleRemoveLayer}>{t('legend.remove_layer')}</MenuItem>}
        {canSetOpacity && groupItems.length === 0 && (
          <MenuItem onClick={handleOpacityOpen}>
            <ListItemText>{t('legend.toggle_opacity')}</ListItemText>
            {isOpacityOpen && (
              <ListItemIcon sx={sxClasses.menuListIcon}>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
          </MenuItem>
        )}
        {zoom < splitZoom && canCluster && groupItems.length === 0 && (
          <MenuItem onClick={handleClusterToggle}>
            <ListItemText> {t('legend.toggle_cluster')}</ListItemText>
            {isClusterToggleEnabled && (
              <ListItemIcon sx={sxClasses.menuListIcon}>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
          </MenuItem>
        )}

        {canZoomTo && groupItems.length === 0 && (
          <MenuItem onClick={handleZoomTo} disabled={!zoomToExtent}>
            <ListItemText>{t('legend.zoom_to')}</ListItemText>
          </MenuItem>
        )}
      </Menu>
      <Collapse in={isOpacityOpen} timeout="auto">
        <Box sx={sxClasses.opacityMenu}>
          <Tooltip title={t('legend.opacity')}>
            <OpacityIcon />
          </Tooltip>
          <SliderBase min={0} max={100} value={opacity * 100} customOnChange={handleSetOpacity} />
          <IconButton color="primary" onClick={() => setOpacityOpen(!isOpacityOpen)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </Collapse>
      <Collapse in={isLegendOpen} timeout={iconType === 'list' ? { enter: 800, exit: 800 } : 'auto'}>
        <Box>
          <Box sx={sxClasses.expandableIconContainer}>
            {iconType === 'simple' && iconImg !== null && <img alt="" style={theme.iconImg} src={iconImg} />}
            {iconType === 'list' && iconList !== null && labelList !== null && (
              <LegendIconList
                iconImages={iconList}
                iconLabels={labelList}
                isParentVisible={isChecked}
                toggleParentVisible={() => setChecked(!isChecked)}
                toggleMapVisible={(sublayerConfig) => {
                  (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic).applyViewFilter(sublayerConfig);
                }}
                layerConfig={geometryLayerConfig as TypeVectorLayerEntryConfig}
                mapId={mapId}
                geometryKey={layerGeometryKey!}
              />
            )}
          </Box>
        </Box>
      </Collapse>
      <Collapse in={isGroupOpen} timeout="auto">
        <Box>
          <Box sx={sxClasses.expandableIconContainer}>
            {groupItems.map((subItem) => (
              <LegendItem
                key={subItem.layerId}
                layerId={layerId}
                geoviewLayerInstance={geoviewLayerInstance}
                subLayerId={subLayerId ? `${subLayerId}/${subItem.layerId}` : `${layerId}/${subItem.layerId}`}
                layerConfigEntry={subItem}
                isParentVisible={isParentVisible === false ? false : isChecked}
                canSetOpacity={canSetOpacity}
                toggleParentVisible={handleToggleLayer}
                expandAll={expandAll}
                hideAll={hideAll}
                canZoomTo={canZoomTo}
              />
            ))}
          </Box>
        </Box>
      </Collapse>
    </Grid>
  );
}
