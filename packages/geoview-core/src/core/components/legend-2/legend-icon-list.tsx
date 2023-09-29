import React, { useState, useEffect } from 'react';
import { useTheme, Theme } from '@mui/material/styles';
import { Checkbox } from '@mui/material';
// import { IconButton, CheckBoxOutIcon, CheckBoxIcon } from '@/ui';
import { api } from '@/app';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import {
  TypeVectorLayerEntryConfig,
  TypeStyleGeometry,
  TypeLayerEntryConfig,
  TypeStyleSettings,
  TypeUniqueValueStyleConfig,
  TypeClassBreakStyleConfig,
} from '../../types/cgpv-types';

const sxClasses = {
  tableIconLabel: {
    color: 'text.primary',
    fontSize: 14,
    noWrap: true,
    marginLeft: 5,
  },
  table: {
    border: '1px solid #C1C1C1',
    borderRadius: '4px',
  },
  tableHeader: {
    borderRight: '1px solid #C1C1C1',
    borderTop: '1px solid #C1C1C1',
    '& th': {
      borderBottom: '1px solid #C1C1C1',
      backgroundColor: '#FFFFFF',
    },
    '& th:first-child': {
      borderRight: '1px solid #C1C1C1',
    },
    borderleft: '1px solid #C1C1C1',
  },
  tableRow: {
    borderBottom: '1px solid #C1C1C1',
    '& td': {
      margin: 0,
      padding: '8px',
      alignItems: 'center',
    },
    '& td:first-child': {
      borderRight: '1px solid #C1C1C1',
      flexGrow: 1,
    },
    '& td:last-child': {
      borderRight: '1px solid #C1C1C1',
    },
  },
};

export interface TypeLegendIconListProps {
  iconImages: string[];
  iconLabels: string[];
  layerConfig?: TypeVectorLayerEntryConfig;
  mapId?: string;
  geometryKey?: TypeStyleGeometry;
  isParentVisible?: boolean;
  toggleParentVisible?: () => void;
  toggleMapVisible?: (layerConfig: TypeLayerEntryConfig) => void;
}

export function LegendIconList(props: TypeLegendIconListProps): JSX.Element {
  const { iconImages, iconLabels, isParentVisible, toggleParentVisible, toggleMapVisible, geometryKey, layerConfig, mapId } = props;
  const theme: Theme & {
    iconImg: React.CSSProperties;
  } = useTheme();

  const allChecked = iconImages.map(() => true);
  const allUnChecked = iconImages.map(() => false);
  const initialChecked = isParentVisible ? allChecked : allUnChecked;

  // set initial visibility of layers according to metadata
  if (layerConfig && layerConfig.style !== undefined && geometryKey) {
    const itemStyle = layerConfig.style[geometryKey];
    if (itemStyle && itemStyle.styleType === 'uniqueValue' && (itemStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo) {
      const uniqueItemStyles = (itemStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo;
      for (let i = 0; i < uniqueItemStyles.length; i++) {
        if (
          uniqueItemStyles[i].visible === 'no' ||
          ((itemStyle as TypeUniqueValueStyleConfig).defaultVisible === 'no' && uniqueItemStyles[i].visible !== 'always')
        ) {
          initialChecked[iconLabels.indexOf(uniqueItemStyles[i].label)] = false;
        }
      }
    } else if (itemStyle && itemStyle.styleType === 'classBreaks' && (itemStyle as TypeClassBreakStyleConfig).classBreakStyleInfo) {
      const classbreakItemStyles = (itemStyle as TypeClassBreakStyleConfig).classBreakStyleInfo;
      for (let i = 0; i < classbreakItemStyles.length; i++) {
        if (
          classbreakItemStyles[i].visible === 'no' ||
          ((itemStyle as TypeClassBreakStyleConfig).defaultVisible === 'no' && classbreakItemStyles[i].visible !== 'always')
        ) {
          initialChecked[iconLabels.indexOf(classbreakItemStyles[i].label)] = false;
        }
      }
    }
  }

  const [isChecked, setChecked] = useState<boolean[]>(initialChecked);
  const [checkedCount, setCheckCount] = useState<number>(isParentVisible ? iconImages.length : 0);
  const [initParentVisible, setInitParentVisible] = useState(isParentVisible);
  const [isAllChecked, setIsAllChecked] = useState(isParentVisible);

  

  const handleToggleAll = () => {
    setIsAllChecked(!isAllChecked);
    setChecked(iconImages.map(() => !isAllChecked));
  };
  /**
   * Handle view/hide layers.
   */
  const handleToggleLayer = (index: number) => {
    const checklist = isChecked.map((checked, i) => (i === index ? !checked : checked));
    const count = checklist.filter((f) => f === true).length;
    setChecked(checklist);
    setCheckCount(count);
    setIsAllChecked(checklist.every((value) => value === true));
    if (isParentVisible !== undefined && toggleParentVisible !== undefined) {
      if ((count === 0 && isParentVisible === true) || (count > 0 && isParentVisible === false)) {
        if (isParentVisible === false) {
          setInitParentVisible(true);
        }
        toggleParentVisible();
      }
    }
  };

  useEffect(() => {
    const getStyleArraySize = (geometryStyle: TypeStyleSettings): number => {
      if (geometryStyle.styleType === 'uniqueValue') return (geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo.length;
      if (geometryStyle.styleType === 'classBreaks') return (geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo.length;
      return 1;
    };

    const handleVisibility = (visibilityLayerConfig: TypeVectorLayerEntryConfig) => {
      const geometryStyle = visibilityLayerConfig.style![geometryKey!];
      if (geometryStyle !== undefined) {
        const styleArraySize = getStyleArraySize(geometryStyle);
        isChecked.forEach((checked, i) => {
          if (geometryStyle.styleType === 'uniqueValue') {
            if (i < styleArraySize) {
              if ((geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[i].visible !== 'always')
                (geometryStyle as TypeUniqueValueStyleConfig).uniqueValueStyleInfo[i].visible = checked === true ? 'yes' : 'no';
            } else if (i === styleArraySize && (geometryStyle as TypeUniqueValueStyleConfig).defaultSettings) {
              (geometryStyle as TypeUniqueValueStyleConfig).defaultVisible = checked === true ? 'yes' : 'no';
            } else if (visibilityLayerConfig.entryType === 'vector' && visibilityLayerConfig.source?.cluster) {
              (geometryStyle as TypeUniqueValueStyleConfig).defaultVisible = 'yes';
            }
          } else if (geometryStyle.styleType === 'classBreaks') {
            if (i < styleArraySize) {
              if ((geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[i].visible !== 'always')
                (geometryStyle as TypeClassBreakStyleConfig).classBreakStyleInfo[i].visible = checked === true ? 'yes' : 'no';
            } else if (i === styleArraySize && (geometryStyle as TypeClassBreakStyleConfig).defaultSettings) {
              (geometryStyle as TypeClassBreakStyleConfig).defaultVisible = checked === true ? 'yes' : 'no';
            } else if (visibilityLayerConfig.entryType === 'vector' && visibilityLayerConfig.source?.cluster) {
              (geometryStyle as TypeUniqueValueStyleConfig).defaultVisible = 'yes';
            }
          }
        });
        if (toggleMapVisible !== undefined) {
          toggleMapVisible(visibilityLayerConfig as TypeLayerEntryConfig);
        }
      }
    };

    if (isParentVisible !== initParentVisible) {
      setChecked(isParentVisible === true ? allChecked : allUnChecked);
      setCheckCount(isParentVisible === true ? allChecked.length : 0);
      setInitParentVisible(isParentVisible);
    }

    if (layerConfig && layerConfig.style !== undefined && geometryKey && mapId) {
      const layerPath = layerConfig.geoviewRootLayer
        ? `${layerConfig.geoviewRootLayer.geoviewLayerId}/${String(layerConfig.layerId).replace('-unclustered', '')}`
        : String(layerConfig.layerId).replace('-unclustered', '');
      const unclusteredLayerPath = `${layerPath}-unclustered`;
      const cluster = !!api.maps[mapId].layer.registeredLayers[unclusteredLayerPath];
      if (cluster) {
        handleVisibility(api.maps[mapId].layer.registeredLayers[layerPath] as TypeVectorLayerEntryConfig);
        handleVisibility(api.maps[mapId].layer.registeredLayers[unclusteredLayerPath] as TypeVectorLayerEntryConfig);
      } else handleVisibility(layerConfig);
    }
  }, [
    isParentVisible,
    allChecked,
    allUnChecked,
    checkedCount,
    initParentVisible,
    isChecked,
    layerConfig,
    geometryKey,
    toggleMapVisible,
    mapId,
  ]);
  
  console.log("Check Count", checkedCount);

  return (
    <TableContainer>
      <Table sx={sxClasses.table}>
        <TableHead>
          <TableRow sx={sxClasses.tableHeader}>
            <TableCell>Name</TableCell>
            <TableCell>
              <Checkbox
                color="primary"
                checked={isAllChecked}
                onChange={handleToggleAll}
              />
            </TableCell>
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
                <Checkbox
                  color="primary"
                  checked={isChecked[index]}
                  onChange={() => handleToggleLayer(index)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

//     <List>
//       {iconImages.map((icon, index) => {
//         return (
//           <Box key={iconLabels[index]}>
//             <ListItem sx={sxClasses.listItem}>
//               <ListItemButton>
//                 <ListItemIcon>
//                   <img alt={iconLabels[index]} src={icon} style={theme.iconImg} />
//                 </ListItemIcon>
//                 <Tooltip title={iconLabels[index]} placement="top" enterDelay={1000}>
//                   <ListItemText
//                     sx={sxClasses.listIconLabel}
//                     primaryTypographyProps={{ fontSize: 14, noWrap: true }}
//                     primary={iconLabels[index]}
//                   />
//                 </Tooltip>
//                 <ListItemIcon>
//                   {iconLabels[index] !== 'Cluster' && layerConfig?.initialSettings?.visible !== 'always' && (
//                     <IconButton color="primary" onClick={() => handleToggleLayer(index)}>
//                       {isChecked[index] === true ? <CheckBoxIcon /> : <CheckBoxOutIcon />}
//                     </IconButton>
//                   )}
//                 </ListItemIcon>
//               </ListItemButton>
//             </ListItem>
//           </Box>
//         );
//       })}
//     </List>