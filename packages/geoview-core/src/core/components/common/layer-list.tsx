import { ReactNode, memo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Box, ChevronRightIcon, IconButton, List, ListItem, ListItemButton, ListItemIcon, Paper, Tooltip, Typography } from '@/ui';
import { IconStack, TypeLayerStatus, TypeQueryStatus } from '@/app';

import { getSxClasses } from './layer-list-style';

export interface LayerListEntry {
  layerName: string;
  layerPath: string;
  layerStatus: TypeLayerStatus;
  queryStatus: TypeQueryStatus;
  layerFeatures?: ReactNode;
  mapFilteredIcon?: ReactNode;
  tooltip?: ReactNode;
  numOffeatures?: number;
}

interface LayerListProps {
  isEnlargeDataTable: boolean;
  layerList: LayerListEntry[];
  selectedLayerPath: string;
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
  const { t } = useTranslation<string>();

  const renderLayerBackground = () => {
    switch (layer.layerStatus) {
      case 'error':
        return sxClasses.backgroundError;

      default:
        break; // Continue with query status logic
    }

    switch (layer.queryStatus) {
      case 'init':
      case 'processing':
        return sxClasses.backgroundProcessing;
      case 'error':
        return sxClasses.backgroundError;
      default:
        return 'unset';
    }
  };

  const renderLayerIcon = () => {
    switch (layer.layerStatus) {
      case 'error':
        return null;

      default:
        return (
          <ListItemIcon>
            <IconStack layerPath={layer.layerPath} />
          </ListItemIcon>
        );
    }
  };

  const renderLayerStatus = () => {
    switch (layer.layerStatus) {
      case 'error':
        return (
          <Box sx={{ display: 'flex', alignContent: 'center' }}>
            <Typography component="p" variant="subtitle1" noWrap>
              {t('legend.layerError')}
            </Typography>
          </Box>
        );

      default:
        switch (layer.queryStatus) {
          case 'init':
          case 'processing':
            return (
              <Box sx={{ display: 'flex', alignContent: 'center' }}>
                <Typography component="p" variant="subtitle1" noWrap>
                  {`${t('layers.querying')}...`}
                </Typography>
              </Box>
            );
          default:
            return (
              <Box sx={{ display: 'flex', alignContent: 'center' }}>
                <Typography component="p" variant="subtitle1" noWrap>
                  {layer.layerFeatures}
                </Typography>
              </Box>
            );
        }
    }
  };

  const renderLayerBody = () => {
    return (
      <Box sx={sxClasses.listPrimaryText}>
        <Typography className="layerTitle">{layer.layerName}</Typography>
        {renderLayerStatus()}
      </Box>
    );
  };

  const renderLayerButton = () => {
    switch (layer.layerStatus) {
      case 'error':
        return null;

      default:
        return (
          <IconButton
            disabled
            edge="end"
            size="small"
            sx={{
              color: `${theme.palette.geoViewColor.primary.main} !important`,
              background: `${theme.palette.geoViewColor.grey.light[100]} !important`,
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        );
    }
  };

  return (
    <Paper
      sx={{
        ...sxClasses.paper,
        border: isSelected ? sxClasses.borderWithIndex : sxClasses.borderNone,
        backgroundColor: renderLayerBackground(),
      }}
    >
      <Tooltip title={layer.tooltip} placement="top" arrow>
        <Box>
          <ListItem disablePadding>
            <ListItemButton selected={isSelected} disabled={layer?.numOffeatures === 0} onClick={() => handleListItemClick(layer)}>
              {renderLayerIcon()}
              {renderLayerBody()}
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
                {renderLayerButton()}
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
 * @param {string} selectedLayerPath  Selected path of the layer.
 * @param {Function} handleListItemClick  Callback function excecuted when list item is clicked.
 * @returns
 */
export function LayerList({ layerList, isEnlargeDataTable, selectedLayerPath, handleListItemClick }: LayerListProps) {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <List sx={sxClasses.list}>
      {layerList.map((layer) => (
        <LayerListItem
          key={layer.layerPath}
          // Reason:- (layer?.numOffeatures ?? 1) > 0
          // Some of layers will not have numOfFeatures, so to make layer look like selected, we need to set default value to 1.
          // Also we cant set numOfFeature initially, then it num of features will be display as sub title.
          isSelected={(layer?.numOffeatures ?? 1) > 0 && layer.layerPath === selectedLayerPath}
          layer={layer}
          handleListItemClick={handleListItemClick}
          isEnlargeDataTable={isEnlargeDataTable}
        />
      ))}
    </List>
  );
}
