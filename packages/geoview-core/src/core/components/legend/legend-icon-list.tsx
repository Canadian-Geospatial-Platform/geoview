/* eslint-disable react/require-default-props */
import React, { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  CheckBoxOutIcon,
  CheckBoxIcon,
} from '../../../ui';
import {
  AbstractGeoViewVector,
  TypeVectorLayerEntryConfig,
  TypeStyleGeometry,
  TypeClassBreakStyleConfig,
  TypeUniqueValueStyleConfig,
} from '../../../app';

const sxClasses = {
  listIconLabel: {
    color: 'text.primary',
    fontSize: 14,
    noWrap: true,
    marginLeft: 5,
  },
  listItem: {
    margin: 0,
    padding: 0,
  },
  iconImg: {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: 'grey.600',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
  },
};

export interface TypeLegendIconListProps {
  iconImages: string[];
  iconLabels: string[];
  geoviewLayerInstance: AbstractGeoViewVector;
  layerConfig?: TypeVectorLayerEntryConfig;
  geometryKey?: string;
  isParentVisible?: boolean;
  toggleParentVisible?: () => void;
}
/**
 * List of Icons to show in expanded Legend Item
 *
 * @returns {JSX.Element} the list of icons
 */
export function LegendIconList(props: TypeLegendIconListProps): JSX.Element {
  const { iconImages, iconLabels, isParentVisible, toggleParentVisible, geometryKey, geoviewLayerInstance, layerConfig } = props;
  const allChecked = iconImages.map(() => true);
  const allUnChecked = iconImages.map(() => false);
  const [isChecked, setChecked] = useState<boolean[]>(isParentVisible === true ? allChecked : allUnChecked);
  const [checkedCount, setCheckCount] = useState<number>(isParentVisible === true ? iconImages.length : 0);
  const [initPV, setInitPV] = useState(isParentVisible);
  /**
   * Handle view/hide layers.
   */
  const handleToggleLayer = (index: number) => {
    const checklist = isChecked.map((checked, i) => (i === index ? !checked : checked));
    const count = checklist.filter((f) => f === true).length;
    setChecked(checklist);
    setCheckCount(count);
    if (isParentVisible !== undefined && toggleParentVisible !== undefined) {
      if ((count === 0 && isParentVisible === true) || (count > 0 && isParentVisible === false)) {
        if (isParentVisible === false) {
          setInitPV(true);
        }
        toggleParentVisible();
      }
    }
  };

  useEffect(() => {
    if (isParentVisible !== initPV) {
      setChecked(isParentVisible === true ? allChecked : allUnChecked);
      setCheckCount(isParentVisible === true ? allChecked.length : 0);
      setInitPV(isParentVisible);
    }
    if (geoviewLayerInstance && layerConfig && layerConfig.style !== undefined && geometryKey) {
      const geometryStyle = layerConfig.style[geometryKey as TypeStyleGeometry];
      if (geometryStyle !== undefined) {
        isChecked.forEach((checked, i) => {
          if (i < isChecked.length - 1) {
            if (geometryStyle.styleType === 'classBreaks') {
              (geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[i].visible = checked === true ? 'yes' : 'no';
            }
            if (geometryStyle.styleType === 'uniqueValue') {
              (geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[i].visible = checked === true ? 'yes' : 'no';
            }
          } else {
            if (geometryStyle.styleType === 'classBreaks') {
              if ((geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo.length === isChecked.length) {
                (geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[i].visible = checked === true ? 'yes' : 'no';
              } else {
                (geometryStyle as TypeUniqueValueStyleConfig).defaultVisible = checked === true ? 'yes' : 'no';
              }
            }
            if (geometryStyle.styleType === 'uniqueValue') {
              if ((geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo.length === isChecked.length) {
                (geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[i].visible = checked === true ? 'yes' : 'no';
              } else {
                (geometryStyle as TypeUniqueValueStyleConfig).defaultVisible = checked === true ? 'yes' : 'no';
              }
            }
          }
        });

        geoviewLayerInstance.applyViewFilter(layerConfig);
      }
    }
  }, [isParentVisible, allChecked, allUnChecked, checkedCount, initPV, isChecked, geoviewLayerInstance, layerConfig, geometryKey]);

  return (
    <List>
      {iconImages.map((icon, index) => {
        return (
          <Box key={iconLabels[index]}>
            <ListItem sx={sxClasses.listItem}>
              <ListItemButton>
                <ListItemIcon>
                  <img alt={iconLabels[index]} src={icon} style={sxClasses.iconImg} />
                </ListItemIcon>
                <Tooltip title={iconLabels[index]} placement="top" enterDelay={1000}>
                  <ListItemText
                    sx={sxClasses.listIconLabel}
                    primaryTypographyProps={{ fontSize: 14, noWrap: true }}
                    primary={iconLabels[index]}
                  />
                </Tooltip>
                <ListItemIcon>
                  <IconButton color="primary" onClick={() => handleToggleLayer(index)}>
                    {isChecked[index] === true ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
                  </IconButton>
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          </Box>
        );
      })}
    </List>
  );
}
