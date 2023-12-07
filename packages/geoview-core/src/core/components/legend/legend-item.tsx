/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useRef, MutableRefObject, RefObject, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';
import { transformExtent } from 'ol/proj';
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
  Grid,
} from '@/ui';
import { api, payloadIsLegendInfo, EsriDynamic, IconStack } from '@/app';
import { LegendIconList } from './legend-icon-list';
import {
  AbstractGeoViewLayer,
  TypeLegend,
  isVectorLegend,
  isWmsLegend,
  isImageStaticLegend,
  TypeWmsLegendStyle,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import {
  TypeClassBreakStyleConfig,
  TypeListOfLayerEntryConfig,
  TypeUniqueValueStyleConfig,
  TypeLayerEntryConfig,
  TypeDisplayLanguage,
  TypeVectorLayerEntryConfig,
  TypeStyleGeometry,
  isClassBreakStyleConfig,
  isUniqueValueStyleConfig,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { disableScrolling } from '../../utils/utilities';
import { WMSStyleItem } from './WMS-style-item';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

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
    iconImage: React.CSSProperties;
  } = useTheme();

  const { mapId } = geoviewLayerInstance;
  const path = subLayerId || `${layerId}/${geoviewLayerInstance.listOfLayerEntryConfig[0]?.layerId}`;
  const [isChecked, setChecked] = useState<boolean>(api.maps[mapId].layer.registeredLayers[path]?.initialSettings?.visible !== 'no');
  const [isOpacityOpen, setOpacityOpen] = useState(false);
  const [isGroupOpen, setGroupOpen] = useState(true);
  const [isLegendOpen, setLegendOpen] = useState(true);
  const [groupItems, setGroupItems] = useState<TypeListOfLayerEntryConfig>([]);
  const [WMSStyles, setWMSStyles] = useState<TypeWmsLegendStyle[]>([]);
  const [currentWMSStyle, setCurrentWMSStyle] = useState<string>();
  const [iconType, setIconType] = useState<string | null>(null);
  const [iconImage, setIconImg] = useState<string | null>(null);
  const [, setIconImgStacked] = useState<string | null>(null);
  const [iconList, setIconList] = useState<string[] | null>(null);
  const [labelList, setLabelList] = useState<string[] | null>(null);
  const [geometryLayerConfig, setLayerConfig] = useState<TypeLayerEntryConfig | null>(null);
  const [layerGeometryKey, setGeometryKey] = useState<TypeStyleGeometry | undefined>(undefined);
  const [layerName, setLayerName] = useState<string>('');
  const [menuAnchorElement, setMenuAnchorElement] = useState<null | HTMLElement>(null);
  const [opacity, setOpacity] = useState<number>(1);

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
      // WMS layers just return a string and get styles
      if (isWmsLegend(layerLegend) || isImageStaticLegend(layerLegend)) {
        if (isWmsLegend(layerLegend) && layerLegend.styles) {
          setWMSStyles(layerLegend.styles);
          setCurrentWMSStyle(layerLegend.styles[0].name);
        }
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
            setIconList(iconImageList);
            if (layerLegend.styleConfig) {
              let geometryKey: TypeStyleGeometry | null = null;
              Object.entries(layerLegend.styleConfig).forEach(([key, styleSettings]) => {
                if (isClassBreakStyleConfig(styleSettings)) {
                  const iconLabelList = (styleSettings as TypeClassBreakStyleConfig).classBreakStyleInfo.map((styleInfo) => {
                    return styleInfo.label;
                  });
                  if (styleRepresentation.defaultCanvas) iconLabelList.push((styleSettings as TypeClassBreakStyleConfig).defaultLabel!);
                  setLabelList(iconLabelList);
                  geometryKey = key as TypeStyleGeometry;
                }
                if (isUniqueValueStyleConfig(styleSettings)) {
                  const iconLabelList = (styleSettings as TypeUniqueValueStyleConfig).uniqueValueStyleInfo.map((styleInfo) => {
                    return styleInfo.label;
                  });
                  if (styleRepresentation.defaultCanvas) iconLabelList.push((styleSettings as TypeUniqueValueStyleConfig).defaultLabel!);
                  setLabelList(iconLabelList);
                  geometryKey = key as TypeStyleGeometry;
                }
              });

              Object.keys(api.maps[mapId].layer.registeredLayers).forEach((layerPath) => {
                if (layerPath.startsWith(geoviewLayerId)) {
                  const layerConfig = api.maps[mapId].layer.registeredLayers[layerPath] as TypeVectorLayerEntryConfig;
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
      setOpacity(geoviewLayerInstance.getOpacity(geoviewLayerInstance.listOfLayerEntryConfig[0]) ?? 1);
      const legendInfo = api.maps[mapId].legend.legendLayerSet.resultSets?.[path]?.data;
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

  useEffect(() => {
    if (layerConfigEntry) {
      if (isParentVisible && isChecked) {
        geoviewLayerInstance.setVisible(true, layerConfigEntry);
      } else {
        geoviewLayerInstance.setVisible(false, layerConfigEntry);
      }
    } else {
      // parent layer with no sub layers
      geoviewLayerInstance.setVisible(isChecked, geoviewLayerInstance.listOfLayerEntryConfig[0]);
    }
  }, [isParentVisible, isChecked, layerConfigEntry, geoviewLayerInstance]);

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
    api.maps[mapId].layer.removeGeoviewLayer(geoviewLayerInstance);
    // NOTE: parent component needs to deal with removing this legend-item when recieving the layer remove event
    handleCloseMenu();
  };

  const handleOpacityOpen = () => {
    setOpacityOpen(!isOpacityOpen);
    handleCloseMenu();
  };

  const handleSetOpacity = (opacityValue: number | number[]) => {
    if (!geoviewLayerInstance) return;
    if (subLayerId) geoviewLayerInstance.setOpacity((opacityValue as number) / 100, subLayerId);
    else geoviewLayerInstance.setOpacity((opacityValue as number) / 100, geoviewLayerInstance.listOfLayerEntryConfig[0]);
  };

  const handleStackIcon = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      handleLegendClick();
    }
  };

  const handleZoomTo = () => {
    let bounds = api.maps[mapId].layer.geoviewLayers[layerId].calculateBounds(path);
    let transformedBounds: Extent | undefined;
    if (bounds) transformedBounds = transformExtent(bounds, `EPSG:${MapEventProcessor.getMapState(mapId).currentProjection}`, `EPSG:4326`);

    if (
      !bounds ||
      (transformedBounds &&
        transformedBounds[0] === -180 &&
        transformedBounds[1] === -90 &&
        transformedBounds[2] === 180 &&
        transformedBounds[3] === 90)
    )
      bounds = api.maps[mapId].getView().get('extent');

    if (bounds) MapEventProcessor.zoomToExtent(mapId, bounds);
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

  return (
    <Grid item sm={12} md={subLayerId ? 12 : 6} lg={subLayerId ? 12 : 4}>
      <ListItem>
        <ListItemButton>
          <ListItemIcon>
            {(groupItems.length > 0 || WMSStyles.length > 1) && (
              <IconButton color="primary" onClick={handleExpandGroupClick}>
                {isGroupOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              </IconButton>
            )}
            {groupItems.length === 0 && isLegendOpen && (
              <IconButton
                sx={sxClasses.iconPreview}
                color="primary"
                size="small"
                onClick={iconImage === null ? undefined : handleLegendClick}
                iconRef={closeIconRef}
              >
                {iconList || iconImage !== null ? <CloseIcon /> : <MoreHorizIcon />}
              </IconButton>
            )}
            {iconType === 'simple' && iconImage !== null && !isLegendOpen && WMSStyles.length < 2 && (
              <IconButton
                sx={sxClasses.iconPreview}
                color="primary"
                size="small"
                iconRef={maxIconRef}
                onClick={iconImage === 'no data' ? undefined : handleLegendClick}
              >
                {iconImage === 'no data' ? (
                  <BrowserNotSupportedIcon />
                ) : (
                  <Box sx={sxClasses.legendIcon}>
                    <img alt="icon" src={iconImage} style={sxClasses.maxIconImg} />
                  </Box>
                )}
              </IconButton>
            )}
            {!isLegendOpen && (
              <IconStack layerPath="esriFeatureLYR4/8" onIconClick={handleLegendClick} onStackIconClick={(e) => handleStackIcon(e)} />
            )}

            {groupItems.length === 0 && WMSStyles.length < 2 && !iconType && !isLegendOpen && (
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
            {api.maps[mapId].layer.registeredLayers[path]?.initialSettings?.visible !== 'always' && (
              <IconButton color="primary" onClick={() => handleToggleLayer()}>
                {(() => {
                  if (isParentVisible === false) return <VisibilityOffIcon />;
                  if (isChecked) return <VisibilityIcon />;
                  return <VisibilityOffIcon />;
                })()}
              </IconButton>
            )}
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
        {isRemoveable && <MenuItem onClick={handleRemoveLayer}>{t('legend.removeLayer')}</MenuItem>}
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
        {canZoomTo && groupItems.length === 0 && (
          <MenuItem onClick={handleZoomTo}>
            <ListItemText>{t('legend.zoomTo')}</ListItemText>
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
            {iconType === 'simple' && iconImage !== null && <img alt="" style={theme.iconImage} src={iconImage} />}
            {iconType === 'list' && iconList !== null && labelList !== null && (
              <LegendIconList
                iconImages={iconList}
                iconLabels={labelList}
                isParentVisible={isChecked}
                toggleMapVisible={(sublayerConfig) => {
                  (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic).applyViewFilter(sublayerConfig);
                }}
                layerConfig={geometryLayerConfig as TypeVectorLayerEntryConfig}
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
          {WMSStyles.length > 1 && (
            <Box sx={sxClasses.expandableIconContainer}>
              {WMSStyles.map((style) => (
                <WMSStyleItem
                  key={`${layerId}-${style.name}`}
                  layerId={layerId}
                  mapId={mapId}
                  subLayerId={subLayerId}
                  style={style}
                  currentWMSStyle={currentWMSStyle}
                  setCurrentWMSStyle={setCurrentWMSStyle as Dispatch<SetStateAction<string>>}
                />
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Grid>
  );
}
