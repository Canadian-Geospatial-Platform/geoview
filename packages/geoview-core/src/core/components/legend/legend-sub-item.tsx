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

import { ListItem, Checkbox, Tooltip } from '../../../ui';

import { TypeLayerEntryConfig, TypeListOfLayerEntryConfig } from '../../../app';

import { MapContext } from '../../app-start';

const useStyles = makeStyles((theme) => ({
  legendItem: {
    paddingLeft: 50,
  },
  subItem: {
    paddingLeft: 100,
  },
  icon: {
    width: 24,
    height: 24,
  },
}));

export interface TypeLegendSubItemProps {
  layerId: string;
  layerConfigEntry: TypeLayerEntryConfig;
}
/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export function LegendSubItem(props: TypeLegendSubItemProps): JSX.Element {
  const mapConfig = useContext(MapContext);
  const mapId = mapConfig.id;

  const classes = useStyles();

  // const { t } = useTranslation<string>();

  const { layerId, layerConfigEntry } = props;

  const [isChecked, setChecked] = React.useState(true);
  const [isGroupOpen, setGroupOpen] = React.useState(false);
  const [isLegendOpen, setLegendOpen] = React.useState(false);

  const [groupItems, setGroupItems] = React.useState<TypeListOfLayerEntryConfig>([]);

  const [iconImg, setIconImg] = React.useState<string | null>(null);

  useEffect(() => {
    // TODO can't get legend for sub item because i'm using layer config
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
            {iconImg !== null && (
              <Avatar className={classes.icon} variant="square" src={isLegendOpen ? '' : iconImg} onClick={() => handleLegendClick()}>
                x
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
        <div>{iconImg !== null && <img alt="" src={iconImg} />}</div>
      </Collapse>
      <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
        <div className={classes.subItem}>
          {groupItems &&
            groupItems.map((subItem) => <LegendSubItem key={`sub-sub-${subItem.layerId}`} layerId={layerId} layerConfigEntry={subItem} />)}
        </div>
      </Collapse>
    </>
  );
}
