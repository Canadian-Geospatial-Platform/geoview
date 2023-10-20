/* eslint-disable react/require-default-props */
import React, { useEffect, useState, useRef, MutableRefObject, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, Theme } from '@mui/material/styles';
import { transformExtent } from 'ol/proj';
import { Extent } from 'ol/extent';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import {
  Box,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  SliderBase,
  CheckIcon,
  Grid,
  List,
  Button,
  Stack,
  Typography,
  ZoomInSearchIcon,
} from '@/ui';
import { api, EsriDynamic, payloadIsLegendInfo, NumberPayload, PayloadBaseClass } from '@/app';
import { LegendIconList } from '../legend-icon-list';
import { TypeLegend, isVectorLegend, isWmsLegend, isImageStaticLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
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
} from '@/geo/map/map-schema-types';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { disableScrolling } from '../../../utils/utilities';
import { TypeLegendItemDetailsProps } from '../types';

const sxClasses = {
  expandableGroup: {
    paddingRight: 0,
    paddingLeft: 28,
  },
  expandableIconContainer: {
    padding: '16px 17px 16px 23px',
    margin: '20px 0',
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
    padding: '8px 20px 7px 15px',
    backgroundColor: '#F6F6F6',
  },
  menuListIcon: { justifyContent: 'right', 'min-width': '56px' },
};

/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */

export function LegendItemDetails(props: TypeLegendItemDetailsProps): JSX.Element {
  const { layerId, geoviewLayerInstance, subLayerId, layerConfigEntry, isRemoveable } = props;

  const { t, i18n } = useTranslation<string>();
  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  const { mapId } = geoviewLayerInstance;
  // check if layer is a clustered, so that clustering can be toggled
  const path = subLayerId || `${layerId}/${geoviewLayerInstance.listOfLayerEntryConfig[0]?.layerId}`;
  const clusterLayerPath = path.replace('-unclustered', '');
  const unclusterLayerPath = `${clusterLayerPath}-unclustered`;
  const canCluster = !!api.maps[mapId].layer.registeredLayers[unclusterLayerPath];
  const [checkIsGroup, setcheckIsGroup_] = useState(false);

  const [isClusterToggleEnabled, setIsClusterToggleEnabled] = useState(false);
  const [isLegendOpen, setLegendOpen] = useState(true);
  const [groupItems, setGroupItems] = useState<TypeListOfLayerEntryConfig>([]);
  const [iconType, setIconType] = useState<string | null>(null);
  const [iconImg, setIconImg] = useState<string | null>(null);
  const [iconList, setIconList] = useState<string[] | null>(null);
  const [labelList, setLabelList] = useState<string[] | null>(null);
  const [geometryLayerConfig, setLayerConfig] = useState<TypeLayerEntryConfig | null>(null);
  const [layerGeometryKey, setGeometryKey] = useState<TypeStyleGeometry | undefined>(undefined);
  const [layerName, setLayerName] = useState<string>('');
  const [opacity, setOpacity] = useState<number>(1);

  const [zoom, setZoom] = useState<number>(api.maps[mapId].currentZoom);
  const splitZoom =
    (api.maps[mapId].layer.registeredLayers[clusterLayerPath]?.source as TypeVectorSourceInitialConfig)?.cluster?.splitZoom || 7;
  const closeIconRef = useRef() as RefObject<HTMLButtonElement>;
  const stackIconRef = useRef() as MutableRefObject<HTMLDivElement | undefined>;
  const maxIconRef = useRef() as RefObject<HTMLButtonElement>;

  const [checkedSublayerNamesAndIcons, setCheckedSublayerNamesAndIcons] = useState<{ layer: string; icon: string }[]>([]);
  const [nochildLayers, setnochildLayers] = useState<{ layer: string; icon: string }[]>([]);
  const store = getGeoViewStore(mapId);

  const getGroupsDetails = (): boolean => {
    let isGroup = false;
    if (layerConfigEntry) {
      if (layerEntryIsGroupLayer(layerConfigEntry)) {
        setGroupItems(layerConfigEntry.listOfLayerEntryConfig);
        isGroup = true;
        setcheckIsGroup_(!setcheckIsGroup_);
      }
    } else if (
      geoviewLayerInstance?.listOfLayerEntryConfig &&
      (geoviewLayerInstance?.listOfLayerEntryConfig.length > 1 || layerEntryIsGroupLayer(geoviewLayerInstance?.listOfLayerEntryConfig[0]))
    ) {
      setGroupItems(geoviewLayerInstance?.listOfLayerEntryConfig);
      isGroup = true;
      setcheckIsGroup_(!setcheckIsGroup_);
    }
    console.log('is GROUP', isGroup);
    console.log('checkIs GROUP', checkIsGroup);

    return isGroup;
  };

  console.log(groupItems);

  const getLegendDetails = (layerLegend: TypeLegend) => {
    const { geoviewLayerId } = geoviewLayerInstance;
    if (layerLegend) {
      if (layerLegend.legend === null) setIconImg('no data');
      // WMS layers just return a string and get styles
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

  const updateSelectedLayers = (selectedLayers: { layer: string; icon: string }[]) => {
    const selectedLayersByLayerName: Record<string, { layer: string; icon: string }[]> = {};
    if (selectedLayers.length > 0) {
      selectedLayers.forEach(({ layer, icon }) => {
        if (!selectedLayersByLayerName[layerName]) {
          selectedLayersByLayerName[layerName] = [{ layer, icon: icon || '' }];
        } else {
          selectedLayersByLayerName[layerName].push({ layer, icon: icon || '' });
        }
      });
    } else {
      selectedLayersByLayerName[layerName] = [];
    }

    store.setState({
      legendState: { ...store.getState().legendState, selectedLayers: selectedLayersByLayerName },
    });
  };

  const handleGetCheckedSublayerNames = (namesAndIcons: { layer: string; icon: string }[]) => {
    setCheckedSublayerNamesAndIcons(namesAndIcons);
  };

  useEffect(() => {
    if (checkedSublayerNamesAndIcons.length > 0) {
      updateSelectedLayers(checkedSublayerNamesAndIcons);
    } else {
      setnochildLayers([]);
      updateSelectedLayers(nochildLayers);
    }
  }, [checkedSublayerNamesAndIcons, nochildLayers]);

  useEffect(() => {
    const mapZoomHandler = (payload: PayloadBaseClass) => {
      if (canCluster) {
        setZoom((payload as NumberPayload).value);
      }
    };
    api.event.on(api.eventNames.MAP.EVENT_MAP_ZOOM_END, mapZoomHandler, mapId);
    return () => {
      api.event.off(api.eventNames.MAP.EVENT_MAP_ZOOM_END, mapId, mapZoomHandler);
    };
  }, [canCluster, mapId]);

  const handleRemoveLayer = () => {
    api.maps[mapId].layer.removeGeoviewLayer(geoviewLayerInstance);
    // NOTE: parent component needs to deal with removing this legend-item when recieving the layer remove event
  };

  const handleSetOpacity = (opacityValue: number | number[]) => {
    if (!geoviewLayerInstance) return;
    if (canCluster) {
      geoviewLayerInstance.setOpacity((opacityValue as number) / 100, clusterLayerPath);
      geoviewLayerInstance.setOpacity((opacityValue as number) / 100, unclusterLayerPath);
    } else if (subLayerId) geoviewLayerInstance.setOpacity((opacityValue as number) / 100, subLayerId);
    else geoviewLayerInstance.setOpacity((opacityValue as number) / 100, geoviewLayerInstance.listOfLayerEntryConfig[0]);
  };

  const handleClusterToggle = () => {
    if (api.maps[mapId].layer.registeredLayers[clusterLayerPath]?.olLayer) {
      api.maps[mapId].layer.registeredLayers[clusterLayerPath]?.olLayer!.setVisible(
        !api.maps[mapId].layer.registeredLayers[clusterLayerPath]?.olLayer!.getVisible()
      );
      api.maps[mapId].layer.registeredLayers[unclusterLayerPath]?.olLayer!.setVisible(
        !api.maps[mapId].layer.registeredLayers[unclusterLayerPath]?.olLayer!.getVisible()
      );
    }
    setIsClusterToggleEnabled(!isClusterToggleEnabled);
  };

  const handleZoomTo = async () => {
    let bounds = await api.maps[mapId].layer.geoviewLayers[layerId].calculateBounds(path);
    let transformedBounds: Extent | undefined;
    if (bounds) transformedBounds = transformExtent(bounds, `EPSG:${api.maps[mapId].currentProjection}`, `EPSG:4326`);

    if (
      !bounds ||
      (transformedBounds &&
        transformedBounds[0] === -180 &&
        transformedBounds[1] === -90 &&
        transformedBounds[2] === 180 &&
        transformedBounds[3] === 90)
    )
      bounds = api.maps[mapId].getView().get('extent');

    if (bounds) api.maps[mapId].zoomToExtent(bounds);
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
    const source = api.maps[mapId].layer.getGeoviewLayerById(layerId)?.listOfLayerEntryConfig[0]?.source as TypeVectorSourceInitialConfig;
    setIsClusterToggleEnabled(source?.cluster?.enable ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid item sm={12}>
      <Stack sx={{ justifyContent: 'space-between', padding: '16px 17px 16px 23px' }} direction="row">
        <div>
          <Typography> {layerName} </Typography>
          <Typography sx={{ fontSize: '0.6em' }}> Layer quick overview info </Typography>
        </div>
        <div>
          {groupItems.length === 0 && (
            <IconButton onClick={handleZoomTo} sx={{ backgroundColor: '#F6F6F6' }}>
              <ZoomInSearchIcon />
            </IconButton>
          )}
        </div>
      </Stack>
      <div style={{ padding: '16px 17px 16px 23px' }}>
        {opacity && groupItems.length === 0 && (
          <Box sx={sxClasses.opacityMenu}>
            <Typography>{t('legend.opacity')}</Typography>
            <SliderBase min={0} max={100} value={opacity * 100} customOnChange={handleSetOpacity} />
          </Box>
        )}
      </div>
      <List>
        <ListItem>
          {isRemoveable && (
            <Button variant="contained" onClick={handleRemoveLayer} type="text">
              {t('legend.remove_layer')}
            </Button>
          )}
        </ListItem>
        {zoom < splitZoom && canCluster && groupItems.length === 0 && (
          <ListItem onClick={handleClusterToggle}>
            <ListItemText> {t('legend.toggle_cluster')}</ListItemText>
            {isClusterToggleEnabled && (
              <ListItemIcon sx={sxClasses.menuListIcon}>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
          </ListItem>
        )}
      </List>
      <Box sx={sxClasses.expandableIconContainer}>
        {iconType === 'simple' && iconImg !== null && <img alt="" style={theme.iconImg} src={iconImg} />}
        {iconType === 'list' && iconList !== null && labelList !== null && (
          <LegendIconList
            iconImages={iconList}
            iconLabels={labelList}
            onGetCheckedSublayerNames={handleGetCheckedSublayerNames}
            mapId={mapId}
            toggleMapVisible={(sublayerConfig) => {
              (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic).applyViewFilter(sublayerConfig);
            }}
            layerConfig={geometryLayerConfig as TypeVectorLayerEntryConfig}
            geometryKey={layerGeometryKey!}
          />
        )}
      </Box>
    </Grid>
  );
}
