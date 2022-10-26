/* eslint-disable react/require-default-props */
import React, { useEffect, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import {
  Avatar,
  Collapse,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Tooltip,
  CloseIcon,
  ExpandMoreIcon,
  ExpandLessIcon,
  TodoIcon,
  ListAltIcon,
} from '../../../ui';
import {
  AbstractGeoViewLayer,
  TypeClassBreakStyleConfig,
  TypeListOfLayerEntryConfig,
  TypeStyleConfigKey,
  TypeUniqueValueStyleConfig,
  TypeLayerEntryConfig,
} from '../../../app';
import { LegendIconList } from './legend-icon-list';

const useStyles = makeStyles((theme) => ({
  legendItem: {
    padding: 0,
  },
  expandableGroup: {
    paddingRight: 0,
    paddingLeft: 28,
  },
  expandableIconContainer: {
    paddingLeft: 15,
  },
  expandableContainerBorder: {
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderColor: '#ABB2B9',
    paddingLeft: 10,
  },
  icon: {
    width: 24,
    height: 24,
  },
}));

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

  const unknownLayerName = 'Unknown Layer Title';

  const classes = useStyles();

  const [isChecked, setChecked] = useState(true);
  const [isGroupOpen, setGroupOpen] = useState(false);
  const [isLegendOpen, setLegendOpen] = useState(false);
  const [groupItems, setGroupItems] = useState<TypeListOfLayerEntryConfig>([]);
  const [iconType, setIconType] = useState<string | null>(null);
  const [iconImg, setIconImg] = useState<string | null>(null);
  const [iconList, setIconList] = useState<string[] | null>(null);
  const [labelList, setLabelList] = useState<string[] | null>(null);

  function isBase64(l: string | Partial<Record<TypeStyleConfigKey, HTMLCanvasElement | HTMLCanvasElement[]>> | ArrayBuffer): l is string {
    return typeof l === 'string';
  }

  function isCanvas(
    l: string | Partial<Record<TypeStyleConfigKey, HTMLCanvasElement | HTMLCanvasElement[]>> | ArrayBuffer
  ): l is Partial<Record<TypeStyleConfigKey, HTMLCanvasElement | HTMLCanvasElement[]>> {
    return (
      Object.keys(l as Record<TypeStyleConfigKey, HTMLCanvasElement | HTMLCanvasElement[]>).indexOf('Point') !== -1 ||
      Object.keys(l as Record<TypeStyleConfigKey, HTMLCanvasElement | HTMLCanvasElement[]>).indexOf('LineString') !== -1 ||
      Object.keys(l as Record<TypeStyleConfigKey, HTMLCanvasElement | HTMLCanvasElement[]>).indexOf('Polygon') !== -1
    );
  }

  const getGroupsDetails = (): boolean => {
    let isGroup = false;
    if (layerConfigEntry) {
      if (layerConfigEntry.entryType === 'group') {
        setGroupItems(layerConfigEntry.listOfLayerEntryConfig as TypeListOfLayerEntryConfig);
        isGroup = true;
      }
    } else if (
      rootGeoViewLayer?.listOfLayerEntryConfig &&
      (rootGeoViewLayer?.listOfLayerEntryConfig.length > 1 || rootGeoViewLayer.listOfLayerEntryConfig[0].entryType === 'group')
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
        if (isBase64(layerLegend.legend)) {
          setIconType('simple');
          setIconImg(layerLegend.legend);
        } else if (isCanvas(layerLegend.legend)) {
          Object.entries(layerLegend.legend).forEach(([key, canvas]) => {
            if ('length' in canvas) {
              setIconType('list');
              const iconImageList = (canvas as HTMLCanvasElement[]).map((c) => {
                return c.toDataURL();
              });
              setIconList(iconImageList);
              if (layerLegend.styleConfig) {
                Object.entries(layerLegend.styleConfig).forEach(([key, styleSettings]) => {
                  if (styleSettings.styleType === 'classBreaks') {
                    const iconLabelList = (styleSettings as TypeClassBreakStyleConfig).classBreakStyleInfos.map((styleInfo) => {
                      return styleInfo.label;
                    });
                    setLabelList(iconLabelList);
                  }
                  if (styleSettings.styleType === 'uniqueValue') {
                    const iconLabelList = (styleSettings as TypeUniqueValueStyleConfig).uniqueValueStyleInfo.map((styleInfo) => {
                      return styleInfo.label;
                    });
                    setLabelList(iconLabelList);
                  }
                });
              }
            } else {
              setIconType('simple');
              setIconImg((canvas as HTMLCanvasElement).toDataURL());
            }
          });
        } else {
          console.log(`${layerId} - UNHANDLED LEGEND TYPE`);
        }
      } else {
        console.log(`${layerId} - NULL LAYER DATA`);
      }
    });
  };

  useEffect(() => {
    const isGroup = getGroupsDetails();
    if (!isGroup) {
      getLegendDetails();
    }
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
      <ListItem className={`${classes.legendItem}`}>
        <ListItemButton>
          <ListItemIcon>
            {groupItems.length > 0 && isGroupOpen && <ExpandMoreIcon onClick={handleExpandClick} />}
            {groupItems.length > 0 && !isGroupOpen && <ExpandLessIcon onClick={handleExpandClick} />}
            {iconType === 'simple' && iconImg !== null && (
              <Avatar className={classes.icon} variant="square" src={isLegendOpen ? '' : iconImg} onClick={() => handleLegendClick()}>
                <CloseIcon />
              </Avatar>
            )}
            {iconType === 'list' && (
              <Avatar className={classes.icon} variant="square" onClick={() => handleLegendClick()}>
                {isLegendOpen ? <CloseIcon /> : <ListAltIcon />}
              </Avatar>
            )}
            {groupItems.length === 0 && !iconType && (
              <Avatar className={classes.icon} variant="square" onClick={() => handleLegendClick()}>
                <TodoIcon />
              </Avatar>
            )}
          </ListItemIcon>
          {layerConfigEntry ? (
            <Tooltip
              title={layerConfigEntry.layerName && layerConfigEntry.layerName.en ? layerConfigEntry.layerName.en : unknownLayerName}
              placement="top"
              enterDelay={1000}
            >
              <ListItemText
                primaryTypographyProps={{ fontSize: 14, noWrap: true }}
                primary={layerConfigEntry.layerName ? layerConfigEntry.layerName.en : unknownLayerName}
              />
            </Tooltip>
          ) : (
            <Tooltip
              title={rootGeoViewLayer && rootGeoViewLayer.geoviewLayerName.en ? rootGeoViewLayer.geoviewLayerName.en : unknownLayerName}
              placement="top"
              enterDelay={1000}
            >
              <ListItemText
                primaryTypographyProps={{ fontSize: 14, noWrap: true }}
                primary={rootGeoViewLayer ? rootGeoViewLayer.geoviewLayerName.en : unknownLayerName}
              />
            </Tooltip>
          )}
          <ListItemIcon>
            <Checkbox checked={isChecked} onClick={() => handleToggleLayer()} />
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Collapse in={isLegendOpen} timeout="auto" unmountOnExit>
        <div className={classes.expandableIconContainer}>
          <div className={classes.expandableContainerBorder}>
            {iconType === 'simple' && iconImg !== null && <img alt="" src={iconImg} />}
            {iconType === 'list' && iconList !== null && labelList !== null && (
              <LegendIconList iconImages={iconList} iconLabels={labelList} />
            )}
          </div>
        </div>
      </Collapse>
      <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
        <div className={classes.expandableGroup}>
          <div className={classes.expandableContainerBorder}>
            {groupItems.map((subItem) => (
              <LegendItem
                key={`sub-${subItem.layerId}`}
                layerId={layerId}
                rootGeoViewLayer={rootGeoViewLayer}
                subLayerId={subLayerId ? `${subLayerId}/${subItem.layerId}` : `${layerId}/${subItem.layerId}`}
                layerConfigEntry={subItem}
              />
            ))}
          </div>
        </div>
      </Collapse>
    </>
  );
}
