/* eslint-disable react/require-default-props */
import React, { useState } from 'react';
import { useTheme, Theme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip, IconButton, CheckBoxOutIcon, CheckBoxIcon } from '@/ui';
import {
  TypeClassBreakStyleConfig,
  TypeLayerEntryConfig,
  TypeStyleGeometry,
  TypeUniqueValueStyleConfig,
  TypeVectorLayerEntryConfig,
} from '../../types/cgpv-types';

const sxClasses = {
  listIconLabel: {
    color: 'text.primary',
    fontSize: 14,
    noWrap: true,
    marginLeft: 5,
  },
  listItem: {
    margin: 0,
    padding: '0 0 0 8px',
  },
};

export interface TypeLegendIconListProps {
  iconImages: string[];
  iconLabels: string[];
  layerConfig?: TypeVectorLayerEntryConfig;
  geometryKey?: TypeStyleGeometry;
  isParentVisible?: boolean;
  toggleMapVisible: (layerConfig: TypeLayerEntryConfig) => void;
}

/**
 * List of Icons to show in expanded Legend Item
 *
 * @returns {JSX.Element} the list of icons
 */
export function LegendIconList(props: TypeLegendIconListProps): JSX.Element {
  const { iconImages, iconLabels, isParentVisible, geometryKey, layerConfig, toggleMapVisible } = props;
  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  const allChecked = iconImages.map(() => true);
  const initialChecked = allChecked;

  // set checkboxes of layers according to metadata
  if (layerConfig && layerConfig.style !== undefined && geometryKey) {
    const itemStyle = layerConfig.style[geometryKey];
    if (itemStyle && itemStyle.styleType === 'uniqueValue' && (itemStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo) {
      const uniqueItemStyles = (itemStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo;
      for (let i = 0; i < uniqueItemStyles.length; i++) {
        if (uniqueItemStyles[i].visible === 'no' && uniqueItemStyles[i].visible !== 'always') {
          initialChecked[iconLabels.indexOf(uniqueItemStyles[i].label)] = false;
        }
      }
    } else if (itemStyle && itemStyle.styleType === 'classBreaks' && (itemStyle as TypeClassBreakStyleConfig).classBreakStyleInfo) {
      const classbreakItemStyles = (itemStyle as TypeClassBreakStyleConfig).classBreakStyleInfo;
      for (let i = 0; i < classbreakItemStyles.length; i++) {
        if (classbreakItemStyles[i].visible === 'no' && classbreakItemStyles[i].visible !== 'always') {
          initialChecked[iconLabels.indexOf(classbreakItemStyles[i].label)] = false;
        }
      }
    }
  }

  const [isChecked, setChecked] = useState<boolean[]>(initialChecked);

  /**
   * Handle view/hide layers.
   */
  const handleToggleLayer = (index: number) => {
    if (layerConfig && geometryKey) {
      const geometryStyle = layerConfig.style![geometryKey];
      if (geometryStyle !== undefined) {
        if (geometryStyle.styleType === 'uniqueValue') {
          if ((geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[index].visible === 'no')
            (geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[index].visible = 'yes';
          else if ((geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[index].visible === 'yes')
            (geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[index].visible = 'no';
        } else if (geometryStyle.styleType === 'classBreaks') {
          if ((geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[index].visible === 'no')
            (geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[index].visible = 'yes';
          else if ((geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[index].visible === 'yes')
            (geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[index].visible = 'no';
        }
      }
      toggleMapVisible(layerConfig);
    }
    const checklist = isChecked.map((checked, i) => (i === index ? !checked : checked));
    setChecked(checklist);
  };

  return (
    <List>
      {iconImages.map((icon, index) => {
        return (
          <Box key={iconLabels[index]}>
            <ListItem sx={sxClasses.listItem}>
              <ListItemButton>
                <ListItemIcon>
                  <img alt={iconLabels[index]} src={icon} style={theme.iconImg} />
                </ListItemIcon>
                <Tooltip title={iconLabels[index]} placement="top" enterDelay={1000}>
                  <ListItemText
                    sx={sxClasses.listIconLabel}
                    primaryTypographyProps={{ fontSize: 14, noWrap: true }}
                    primary={iconLabels[index]}
                  />
                </Tooltip>
                <ListItemIcon>
                  {iconLabels[index] !== 'Cluster' && layerConfig?.initialSettings?.visible !== 'always' && isParentVisible && (
                    <IconButton color="primary" onClick={() => handleToggleLayer(index)}>
                      {isChecked[index] === true ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
                    </IconButton>
                  )}
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          </Box>
        );
      })}
    </List>
  );
}
