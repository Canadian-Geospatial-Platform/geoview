/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useRef, MutableRefObject, RefObject, Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
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
  VisibilityOutlinedIcon,
  VisibilityOffOutlinedIcon,
  IconButton,
  MoreHorizIcon,
  BrowserNotSupportedIcon,
  KeyboardArrowDownIcon,
  KeyboardArrowRightIcon,
  KeyboardArrowUpIcon,
  GroupWorkOutlinedIcon,
  Grid,
} from '@/ui';
import { api, payloadIsLegendInfo } from '@/app';
import {
  TypeLegend,
  isVectorLegend,
  isWmsLegend,
  isImageStaticLegend,
  TypeWmsLegendStyle,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeListOfLayerEntryConfig, TypeDisplayLanguage, layerEntryIsGroupLayer } from '@/geo/map/map-schema-types';
import { disableScrolling } from '../../utils/utilities';
import { WMSStyleItem } from './WMS-style-item';
import { TypeLegendItemProps } from './types';
import { getGeoViewStore } from '@/core/stores/stores-managers';

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

  legendItem: {
    background: '#FFFFFF 0% 0% no-repeat padding-box',
    borderRadius: '5px',
    marginBottom: '5px',
  },
  selectedLegendItem: {
    border: '2px solid #515BA5',
  },

  subLegendItemsContainer: {
    background: '#F1F2F5 0% 0% no-repeat padding-box',
    boxShadow: 'inset 0px 3px 6px #00000029',
    borderRadius: '5px',
    padding: '20px',
  },

  subLegendItem: {},
};

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
  } = props;

  const { t, i18n } = useTranslation<string>();

  const { mapId } = geoviewLayerInstance;
  const store = getGeoViewStore(mapId);

  const selectedLegendItem = useStore(store, (state) => state.legendState.selectedItem);
  const legendItemIsSelected = layerId === selectedLegendItem?.layerId && subLayerId === selectedLegendItem.subLayerId;
  const legendClass = legendItemIsSelected ? { ...sxClasses.legendItem, ...sxClasses.selectedLegendItem } : sxClasses.legendItem;

  // check if layer is a clustered, so that clustering can be toggled
  const path = subLayerId || `${layerId}/${geoviewLayerInstance.listOfLayerEntryConfig[0]?.layerId}`;
  const clusterLayerPath = path.replace('-unclustered', '');

  const [isChecked, setChecked] = useState<boolean>(
    api.maps[mapId].layer.registeredLayers[clusterLayerPath]?.initialSettings?.visible !== 'no'
  );

  const [isGroupOpen, setGroupOpen] = useState(true);
  const [isLegendOpen, setLegendOpen] = useState(true);
  const [groupItems, setGroupItems] = useState<TypeListOfLayerEntryConfig>([]);
  const [WMSStyles, setWMSStyles] = useState<TypeWmsLegendStyle[]>([]);
  const [currentWMSStyle, setCurrentWMSStyle] = useState<string>();
  const [iconType, setIconType] = useState<string | null>(null);
  const [iconImg, setIconImg] = useState<string | null>(null);
  const [iconImgStacked, setIconImgStacked] = useState<string | null>(null);
  const [iconList, setIconList] = useState<string[] | null>(null);
  const [layerName, setLayerName] = useState<string>('');

  const closeIconRef = useRef() as RefObject<HTMLButtonElement>;
  const stackIconRef = useRef() as MutableRefObject<HTMLDivElement | undefined>;
  const maxIconRef = useRef() as RefObject<HTMLButtonElement>;

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
            if (styleRepresentation.clusterCanvas) iconImageList.push(styleRepresentation.clusterCanvas.toDataURL());
            setIconList(iconImageList);
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
    store.setState({
      legendState: { ...store.getState().legendState, selectedItem: props, selectedIsVisible: isChecked },
    });
    const legendDetails = document.querySelector('#legend-details-container');
    if (legendDetails) {
      legendDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  useEffect(() => {
    if (isChecked !== store.getState().legendState.selectedIsVisible)
      store.setState({
        legendState: { ...store.getState().legendState, selectedIsVisible: isChecked },
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecked]);

  const handleStackIcon = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      handleLegendClick();
    }
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

  function showDetailsIcon() {
    return (
      <>
        {(groupItems.length > 0 || WMSStyles.length > 1) && (
          <IconButton color="primary" onClick={handleExpandGroupClick}>
            {isGroupOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
          </IconButton>
        )}
        {groupItems.length === 0 && (
          <IconButton onClick={handleLegendClick}>
            <KeyboardArrowRightIcon />
          </IconButton>
        )}
      </>
    );
  }

  // <Grid item sm={12} md={subLayerId ? 12 : 6} lg={subLayerId ? 12 : 4}>
  return (
    <Grid item sm={12} sx={legendClass}>
      <ListItem onClick={handleLegendClick}>
        <ListItemButton>
          <ListItemIcon>
            {(groupItems.length > 0 || WMSStyles.length > 1) && (
              <IconButton color="primary">
                <GroupWorkOutlinedIcon />
              </IconButton>
            )}
            {groupItems.length === 0 && isLegendOpen && (
              <IconButton sx={sxClasses.iconPreview} color="primary" size="small" iconRef={closeIconRef}>
                {iconList || iconImg !== null ? <CloseIcon /> : <MoreHorizIcon />}
              </IconButton>
            )}
            {iconType === 'simple' && iconImg !== null && !isLegendOpen && WMSStyles.length < 2 && (
              <IconButton sx={sxClasses.iconPreview} color="primary" size="small" iconRef={maxIconRef}>
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
            {api.maps[mapId].layer.registeredLayers[clusterLayerPath]?.initialSettings?.visible !== 'always' && (
              <IconButton color="primary" onClick={() => handleToggleLayer()}>
                {(() => {
                  if (isParentVisible === false) return <VisibilityOffOutlinedIcon />;
                  if (isChecked) return <VisibilityOutlinedIcon />;
                  return <VisibilityOffOutlinedIcon />;
                })()}
              </IconButton>
            )}
            {showDetailsIcon()}
          </ListItemIcon>
        </ListItemButton>
      </ListItem>

      <Collapse in={isGroupOpen} timeout="auto">
        <Box>
          {groupItems.length > 0 && (
            <Box sx={sxClasses.subLegendItemsContainer}>
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
                  isRemoveable={isRemoveable}
                />
              ))}
            </Box>
          )}
          {WMSStyles.length > 1 && (
            <Box sx={sxClasses.subLegendItemsContainer}>
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
