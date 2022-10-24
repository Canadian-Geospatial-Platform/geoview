import React, { useContext, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import makeStyles from '@mui/styles/makeStyles';
// TODO wrap in UI
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Collapse from '@mui/material/Collapse';
import TodoIcon from '@mui/icons-material/LiveHelp';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ListAlt from '@mui/icons-material/ListAlt';

import { ListItem, Checkbox, Tooltip } from '../../../ui';

import {
  api,
  TypeClassBreakStyleConfig,
  TypeIconSymbolVectorConfig,
  TypeLayerEntryConfig,
  TypeListOfLayerEntryConfig,
  TypeSimpleStyleConfig,
  TypeStyleConfigKey,
  TypeStyleSettings,
  TypeUniqueValueStyleConfig,
} from '../../../app';

import { MapContext } from '../../app-start';
import { UniqueValueInfos } from './unique-value-infos';

const useStyles = makeStyles((theme) => ({
  legendItem: {
    paddingLeft: 50,
  },
  subItem: {
    paddingLeft: 50,
  },
  icon: {
    width: 24,
    height: 24,
  },
}));

export interface TypeLegendSubItemProps {
  layerId: string;
  subLayerId: string;
  layerConfigEntry: TypeLayerEntryConfig;
}
/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export function LegendSubItem(props: TypeLegendSubItemProps): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;
  const { layers } = api.map(mapId).layer;

  const classes = useStyles();

  // const { t } = useTranslation<string>();

  const { layerId, subLayerId, layerConfigEntry } = props;

  const [isChecked, setChecked] = React.useState(true);
  const [isGroupOpen, setGroupOpen] = React.useState(false);
  const [isLegendOpen, setLegendOpen] = React.useState(false);

  const [groupItems, setGroupItems] = React.useState<TypeListOfLayerEntryConfig>([]);

  const [iconType, setIconType] = React.useState<string | null>(null);
  const [iconImg, setIconImg] = React.useState<string | null>(null);

  const [styleInfo, setStyleInfo] = React.useState<TypeSimpleStyleConfig | TypeUniqueValueStyleConfig | TypeClassBreakStyleConfig | null>(null);

  function isBase64(l: string | Partial<Record<TypeStyleConfigKey, TypeStyleSettings>> | ArrayBuffer): l is string {
    return typeof l === 'string';
  }

  function isStyle(
    l: string | Partial<Record<TypeStyleConfigKey, TypeStyleSettings>> | ArrayBuffer
  ): l is Partial<Record<TypeStyleConfigKey, TypeStyleSettings>> {
    return (
      Object.keys(l as Record<TypeStyleConfigKey, TypeStyleSettings>).indexOf('Point') !== -1 ||
      Object.keys(l as Record<TypeStyleConfigKey, TypeStyleSettings>).indexOf('LineString') !== -1 ||
      Object.keys(l as Record<TypeStyleConfigKey, TypeStyleSettings>).indexOf('Polygon') !== -1
    );
  }

  const simpleStyleParser = (style: TypeSimpleStyleConfig) => {
    // simple can still be image or style
    if (style.settings.type === 'iconSymbol') {
      const iconSettings = style.settings as TypeIconSymbolVectorConfig;
      setIconImg(`data:${iconSettings.mimeType};base64,${iconSettings.src}`);
    } else {
      // TODO handle simple vector styles
      setStyleInfo(style);
    }
  };

  useEffect(() => {
    layers[layerId].getLegend(`${subLayerId}`).then((layerLegend) => {
      if (layerLegend) {
        // WMS layers just return a string
        if (isBase64(layerLegend.legend)) {
          setIconType('simple');
          setIconImg(layerLegend.legend);
        } else if (isStyle(layerLegend.legend)) {
          Object.entries(layerLegend.legend).forEach(([key, styleSettings]) => {
            if (styleSettings.styleType === 'simple') {
              const simpleStyle = styleSettings as TypeSimpleStyleConfig;
              setIconType('simple');
              simpleStyleParser(simpleStyle);
            } else if (styleSettings.styleType === 'uniqueValue') {
              const uniqueStyle = styleSettings as TypeUniqueValueStyleConfig;
              setIconType('unique');
              setStyleInfo(uniqueStyle);
            } else if (styleSettings.styleType === 'classBreaks') {
              const classBreakStyle = styleSettings as TypeClassBreakStyleConfig;
              // TODO unhandled
            }
          });
        } else {
          console.log(`${layerId} - UNHANDLED LEGEND TYPE`);
        }
      } else {
        console.log(`${layerId} - NULL LAYER DATA`);
      }
    });
    if (layerConfigEntry.entryType === 'group') {
      setGroupItems(layerConfigEntry.listOfLayerEntryConfig as TypeListOfLayerEntryConfig);
    }
  }, []);

  useEffect(() => {
    layerConfigEntry.gvLayer?.setVisible(isChecked);
  }, [isChecked]);

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
          {groupItems.length > 0 && isGroupOpen && <ExpandMore onClick={handleExpandClick} />}
          {groupItems.length > 0 && !isGroupOpen && <ExpandLess onClick={handleExpandClick} />}
          <ListItemIcon>
            {iconType === 'simple' && iconImg !== null && (
              <Avatar className={classes.icon} variant="square" src={isLegendOpen ? '' : iconImg} onClick={() => handleLegendClick()}>
                x
              </Avatar>
            )}
            {iconType === 'unique' && (
              <Avatar className={classes.icon} variant="square" onClick={() => handleLegendClick()}>
                {isLegendOpen ? 'x' : <ListAlt />}
              </Avatar>
            )}
            {groupItems.length === 0 && !iconType && (
              <Avatar className={classes.icon} variant="square" onClick={() => handleLegendClick()}>
                <TodoIcon />
              </Avatar>
            )}
          </ListItemIcon>
          <Tooltip
            title={layerConfigEntry.layerName && layerConfigEntry.layerName.en ? layerConfigEntry.layerName.en : 'Unknown layer title'}
            placement="top"
            enterDelay={1000}
          >
            <ListItemText primary={layerConfigEntry.layerName ? layerConfigEntry.layerName.en : 'Unknown layer title'} />
          </Tooltip>
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={isChecked}
              onClick={() => handleToggleLayer()}
              // inputProps={{ 'aria-labelledby': labelId }}
            />
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <Collapse in={isLegendOpen} timeout="auto" unmountOnExit>
        <div>
          {iconType === 'simple' && iconImg !== null && <img alt="" src={iconImg} />}
          {iconType === 'unique' && styleInfo && <UniqueValueInfos uniqueInfoConfig={styleInfo as TypeUniqueValueStyleConfig} />}
        </div>
      </Collapse>
      <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
        <div className={classes.subItem}>
          {groupItems &&
            groupItems.map((subItem) => (
              <LegendSubItem
                key={`sub-sub-${subItem.layerId}`}
                layerId={layerId}
                subLayerId={`${subLayerId}/${subItem.layerId}`}
                layerConfigEntry={subItem}
              />
            ))}
        </div>
      </Collapse>
    </>
  );
}
