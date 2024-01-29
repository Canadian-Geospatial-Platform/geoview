import { ReactNode, memo } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, ChevronRightIcon, IconButton, List, ListItem, ListItemButton, ListItemIcon, Paper, Tooltip, Typography } from '@/ui';
import { getSxClasses } from './layer-list-style';
import { IconStack } from '@/app';

export interface LayerListEntry {
  layerName: string;
  layerPath: string;
  layerFeatures?: ReactNode;
  mapFilteredIcon?: ReactNode;
  tooltip?: ReactNode;
  numOffeatures?: number;
}

interface LayerListProps {
  isEnlargeDataTable: boolean;
  layerList: LayerListEntry[];
  selectedLayerIndex: number;
  handleListItemClick: (layer: LayerListEntry) => void;
}

interface LayerListItemProps {
  isSelected: boolean;
  layer: LayerListEntry;
  handleListItemClick: (layer: LayerListEntry) => void;
  isEnlargeDataTable: boolean;
}

const LayerListItem = memo(function LayerListItem({ isSelected, layer, handleListItemClick, isEnlargeDataTable }: LayerListItemProps) {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Paper sx={{ ...sxClasses.paper, border: isSelected ? sxClasses.borderWithIndex : sxClasses.borderNone }}>
      <Tooltip title={layer.tooltip} placement="top" arrow>
        <Box>
          <ListItem disablePadding>
            <ListItemButton selected={isSelected} disabled={layer?.numOffeatures === 0} onClick={() => handleListItemClick(layer)}>
              <ListItemIcon>
                <IconStack layerPath={layer.layerPath} />
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
  );
});

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
        <LayerListItem
          key={layer.layerPath}
          isSelected={!!layer.numOffeatures && index === selectedLayerIndex}
          layer={layer}
          handleListItemClick={handleListItemClick}
          isEnlargeDataTable={isEnlargeDataTable}
        />
      ))}
    </List>
  );
}
