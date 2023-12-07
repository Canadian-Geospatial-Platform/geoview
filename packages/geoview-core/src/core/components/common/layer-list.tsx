import { ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  ChevronRightIcon,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Paper,
  Tooltip,
  Typography,
  CircularProgressBase,
} from '@/ui';
import { getSxClasses } from './layer-list-style';
import { IconStack } from '@/app';

export interface LayerListEntry {
  layerName: string;
  layerPath: string;
  layerFeatures?: ReactNode | undefined;
  mapFilteredIcon?: ReactNode | undefined;
  tooltip?: ReactNode | undefined;
  layerFlags?: { layerStatus: string };
  numOffeatures?: number;
}

interface LayerListProps {
  isEnlargeDataTable: boolean;
  layerList: LayerListEntry[];
  selectedLayerIndex: number;
  handleListItemClick: (layer: LayerListEntry, index: number) => void;
}

/**
 * Create a list of layers
 * @param {LayerListEntry} layerList  Array of layer list entries.
 * @param {boolean} isEnlargeDataTable  Boolean value if right panel is enlarged or not.
 * @param {number} selectedLayerIndex  Current index of list item selected.
 * @param {Function} handleListItemClick  Callback function excecuted when list item is clicked.
 * @returns
 */
export function LayerList({ layerList, isEnlargeDataTable, selectedLayerIndex, handleListItemClick }: LayerListProps) {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <List sx={sxClasses.list}>
      {layerList.map((layer, index) => (
        <Paper
          sx={{
            ...sxClasses.paper,
            border: selectedLayerIndex === index && layer.numOffeatures !== 0 ? sxClasses.borderWithIndex : sxClasses.borderNone,
          }}
          key={layer.layerPath}
        >
          <Tooltip title={layer.tooltip} placement="top" arrow>
            <Box>
              <ListItem disablePadding>
                <ListItemButton
                  disabled={layer.numOffeatures === 0}
                  selected={selectedLayerIndex === index && layer.numOffeatures !== 0}
                  onClick={() => handleListItemClick(layer, index)}
                >
                  <ListItemIcon>
                    {/* // TODO line below might need to be reviewd related to getting layer status correctly  */}
                    {layer.layerFlags?.layerStatus === 'loading' ? (
                      <CircularProgressBase size={20} />
                    ) : (
                      <IconStack layerPath={layer.layerPath} />
                    )}
                  </ListItemIcon>
                  <Box sx={sxClasses.listPrimaryText}>
                    <Typography className="layerTitle">{layer.layerName}</Typography>
                    {!!layer?.layerFeatures && (
                      <Box sx={{ display: 'flex', alignContent: 'center' }}>
                        <Typography component="p" variant="subtitle1" noWrap>
                          {layer.layerFeatures}
                        </Typography>

                        {!!layer.mapFilteredIcon && layer.mapFilteredIcon}
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
