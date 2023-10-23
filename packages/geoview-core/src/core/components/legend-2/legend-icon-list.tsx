/* eslint-disable react/require-default-props */
import React, { useRef, useState, useEffect } from 'react';
import { useTheme, Theme } from '@mui/material/styles';
import { Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useStore } from 'zustand';
import { IconButton, CheckBoxOutIcon, CheckBoxIcon } from '@/ui';
import {
  TypeVectorLayerEntryConfig,
  TypeStyleGeometry,
  TypeLayerEntryConfig,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
} from '../../types/cgpv-types';
import { getGeoViewStore } from '@/core/stores/stores-managers';

const sxClasses = {
  tableIconLabel: {
    color: 'text.primary',
    fontSize: 14,
    noWrap: true,
    marginLeft: 20,
  },
  table: {
    border: '1px solid #C1C1C1',
    borderRadius: '4px',
    padding: '16px 17px 16px 23px',
  },
  tableHeader: {
    '& th': {
      borderBottom: '1px solid #C1C1C1',
      height: 52,
      backgroundColor: '#FFFFFF',
      padding: '2px 4px 2px 4px',
      borderRight: '1px solid #C1C1C1',
    },
    '& th:first-child': {
      padding: '2px 4px 2px 20px',
    },
  },
  tableRow: {
    '& td': {
      borderBottom: '1px solid #C1C1C1',
      height: 52,
      margin: 0,
      padding: '2px 4px 2px 4px',
      alignItems: 'center',
      borderRight: '1px solid #C1C1C1',
    },
    '& td:first-child': {
      padding: '2px 4px 2px 20px',
    },
  },
};

export interface TypeLegendIconListProps {
  iconImages: string[];
  iconLabels: string[];
  mapId: string;
  layerConfig?: TypeVectorLayerEntryConfig;
  geometryKey?: TypeStyleGeometry;
  toggleMapVisible: (layerConfig: TypeLayerEntryConfig) => void;
  onGetCheckedSublayerNames?: (checkedSublayerNames: { layer: string; icon: string }[]) => void;
}

export function LegendIconList(props: TypeLegendIconListProps): JSX.Element {
  const { iconImages, iconLabels, toggleMapVisible, geometryKey, layerConfig, mapId, onGetCheckedSublayerNames } = props;
  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  const allChecked = iconImages.map(() => true);
  const allUnChecked = iconImages.map(() => false);

  const isParentVisible = useStore(getGeoViewStore(mapId), (state) => state.legendState.selectedIsVisible);
  const isParentVisibleRef = useRef(isParentVisible);
  isParentVisibleRef.current = isParentVisible;

  const initialChecked = isParentVisible ? allChecked : allUnChecked;
  const [isChecked, setChecked] = useState<boolean[]>(initialChecked);
  const [isAllChecked, setIsAllChecked] = useState(initialChecked.every((checked) => checked));

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
    setIsAllChecked(checklist.every((value) => value === true));
  };

  const handleToggleAll = () => {
    if (layerConfig && geometryKey) {
      const geometryStyle = layerConfig.style![geometryKey];
      if (geometryStyle !== undefined) {
        if (geometryStyle.styleType === 'uniqueValue') {
          for (let i = 0; i < (geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo.length; i++) {
            if ((geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[i].visible !== 'always')
              (geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[i].visible = isAllChecked ? 'no' : 'yes';
          }
        } else if (geometryStyle.styleType === 'classBreaks') {
          for (let i = 0; i < (geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo.length; i++) {
            if ((geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[i].visible !== 'always')
              (geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[i].visible = isAllChecked ? 'no' : 'yes';
          }
        }
      }
      toggleMapVisible(layerConfig);
    }
    setChecked(iconImages.map(() => !isAllChecked));
    setIsAllChecked(!isAllChecked);
  };

  useEffect(() => {
    if (onGetCheckedSublayerNames) {
      const checkedSublayerNamesAndIcons = iconLabels
        .map((label, index) => {
          if (isChecked[index]) {
            return {
              layer: label,
              icon: iconImages[index] ?? '',
            };
          }
          return null;
        })
        .filter((pair) => pair !== null) as { layer: string; icon: string }[];

      onGetCheckedSublayerNames(checkedSublayerNamesAndIcons);
    }
  }, [
    isParentVisible,
    allChecked,
    allUnChecked,
    isChecked,
    layerConfig,
    geometryKey,
    toggleMapVisible,
    mapId,
    iconLabels,
    iconImages,
    onGetCheckedSublayerNames,
  ]);

  return (
    <TableContainer>
      <Table sx={sxClasses.table}>
        <TableHead>
          <TableRow sx={sxClasses.tableHeader}>
            <TableCell>Name</TableCell>
            {isParentVisibleRef.current && (
              <TableCell>
                <Checkbox color="primary" checked={isAllChecked} onChange={handleToggleAll} />
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {iconImages.map((icon, index) => (
            <TableRow key={iconLabels[index]} sx={sxClasses.tableRow}>
              <TableCell>
                <img alt={iconLabels[index]} src={icon} style={theme.iconImg} />
                <span style={sxClasses.tableIconLabel}>{iconLabels[index]}</span>
              </TableCell>
              <TableCell>
                {iconLabels[index] !== 'Cluster' && layerConfig?.initialSettings?.visible !== 'always' && (
                  <IconButton color="primary" onClick={() => handleToggleLayer(index)}>
                    {isChecked[index] === true ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
                  </IconButton>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
