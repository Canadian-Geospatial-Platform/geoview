// import { MouseEvent } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  Box,
  ChevronRightIcon,
  FilterAltIcon,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Paper,
  Tooltip,
  Typography,
} from '@/ui';
import { getSxClasses } from './layer-list-style';
import { IconStack } from '@/app';

export interface LayerListEntry {
  layerName: string;
  numOffeatures?: number;
  layerPath: string;
}

interface LayerListProps {
  isEnlargeDataTable: boolean;
  layerList: LayerListEntry[];
  selectedLayerIndex: number;
  handleListItemClick: (layer: LayerListEntry, index: number) => void;
  rowsFiltered?: Record<string, number> | undefined;
  mapFiltered?: Record<string, boolean> | undefined;
}

export function LayerList({
  layerList,
  isEnlargeDataTable,
  selectedLayerIndex,
  handleListItemClick,
  rowsFiltered = {},
  mapFiltered = {},
}: LayerListProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const sxClasses = getSxClasses(theme);

  /**
   * Check if filtered are being set for each layer.
   * @param {string} layerPath The path of the layer
   * @returns boolean
   */
  const isMapFilteredSelectedForLayer = (layerPath: string): boolean => !!mapFiltered[layerPath];

  /**
   * Get number of features of a layer with filtered or selected layer.
   * @param {string} layerPath the path of the layer
   * @param {number} index index of layer in the list
   * @returns
   */
  const getFeaturesOfLayer = (layerPath: string, index: number): string => {
    return rowsFiltered && rowsFiltered[layerPath]
      ? `${rowsFiltered[layerPath]} ${t('dataTable.featureFiltered')}`
      : `${layerList[index].numOffeatures} ${t('dataTable.features')}`;
  };

  /**
   * Create layer tooltip
   * @param {TypeLocalizedString} layerName en/fr layer name
   * @param {string} layerPath the path of the layer.
   * @param {number} index an index of the layer in the array.
   * @returns
   */
  const getLayerTooltip = (layerName: string, layerPath: string, index: number): React.ReactNode => {
    return (
      <Box sx={{ display: 'flex', alignContent: 'center', '& svg ': { width: '0.75em', height: '0.75em' } }}>
        {`${layerName}${layerList[index].numOffeatures ? `, ${getFeaturesOfLayer(layerPath, index)}` : ''}`}
        {isMapFilteredSelectedForLayer(layerPath) && <FilterAltIcon />}
      </Box>
    );
  };

  return (
    <List sx={sxClasses.list}>
      {layerList.map((layer, index) => (
        <Paper
          sx={{ ...sxClasses.paper, border: selectedLayerIndex === index ? sxClasses.borderWithIndex : sxClasses.borderNone }}
          key={layer.layerPath}
        >
          <Tooltip title={getLayerTooltip(layer.layerName, layer.layerPath, index)} placement="top" arrow>
            <Box>
              <ListItem disablePadding>
                <ListItemButton selected={selectedLayerIndex === index} onClick={() => handleListItemClick(layer, index)}>
                  <ListItemIcon>
                    <IconStack layerPath={layer.layerPath} />
                  </ListItemIcon>
                  <Box sx={sxClasses.listPrimaryText}>
                    <Typography component="p">{layer.layerName}</Typography>
                    {!!layer?.numOffeatures && (
                      <Box sx={{ display: 'flex', alignContent: 'center' }}>
                        <Typography component="p" variant="subtitle1" noWrap>
                          {getFeaturesOfLayer(layer.layerPath, index)}
                        </Typography>

                        {isMapFilteredSelectedForLayer(layer.layerPath) && <FilterAltIcon sx={{ color: theme.palette.grey['500'] }} />}
                      </Box>
                    )}
                  </Box>
                  <Box
                    sx={{
                      padding: isEnlargeDataTable ? '0.25rem' : '1rem',
                      paddingRight: isEnlargeDataTable ? '0.25rem' : '1rem',
                      [theme.breakpoints.down('xl')]: {
                        display: isEnlargeDataTable ? 'none !important' : 'block',
                      },
                      [theme.breakpoints.down('sm')]: {
                        display: 'none',
                      },
                    }}
                  >
                    <IconButton
                      disabled
                      edge="end"
                      size="small"
                      sx={{ color: `${theme.palette.primary.main} !important`, background: `${theme.palette.grey.A100} !important` }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>
                </ListItemButton>
              </ListItem>
            </Box>
          </Tooltip>
        </Paper>
      ))}
    </List>
  );
}
