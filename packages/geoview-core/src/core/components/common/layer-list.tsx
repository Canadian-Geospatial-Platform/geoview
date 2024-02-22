import { ReactNode, memo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Box, ChevronRightIcon, IconButton, List, ListItem, ListItemButton, ListItemIcon, Paper, Tooltip, Typography } from '@/ui';
import { IconStack, TypeArrayOfFeatureInfoEntries, TypeLayerStatus, TypeQueryStatus } from '@/app';

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
  features: TypeArrayOfFeatureInfoEntries;
}

interface LayerListProps {
  isEnlarged: boolean;
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onListItemClick: (layer: LayerListEntry) => void;
}

interface LayerListItemProps {
  isSelected: boolean;
  layer: LayerListEntry;
  isEnlarged: boolean;
  onListItemClick: (layer: LayerListEntry) => void;
}

const LayerListItem = memo(function LayerListItem({ isSelected, layer, onListItemClick, isEnlarged }: LayerListItemProps) {
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
        return sxClasses.default;
    }
  };

  const renderLayerIcon = () => {
    switch (layer.layerStatus) {
      case 'error':
        return null;

      default:
        // If there's a layer path
        if (layer.layerPath) {
          return (
            <ListItemIcon>
              <IconStack layerPath={layer.layerPath} />
            </ListItemIcon>
          );
        }
        return null;
    }
  };

  const renderLayerStatus = () => {
    switch (layer.layerStatus) {
      case 'error':
        return t('legend.layerError');

      default:
        switch (layer.queryStatus) {
          case 'init':
          case 'processing':
            return `${t('layers.querying')}...`;
          default:
            return (
              <>
                {layer.layerFeatures} {layer?.mapFilteredIcon ?? ''}
              </>
            );
        }
    }
  };

  const renderLayerBody = () => {
    return (
      <Box sx={sxClasses.listPrimaryText}>
        <Typography className="layerTitle">{layer.layerName}</Typography>
        <Box display="flex" alignContent="center">
          <Typography component="p" variant="subtitle1" noWrap display="flex">
            {renderLayerStatus()}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderLayerButton = () => {
    switch (layer.layerStatus) {
      case 'error':
        return null;

      default:
        return (
          <IconButton edge="end" size="small" className="style1">
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
            <ListItemButton
              selected={isSelected}
              // disable when layer features has null value.
              disabled={layer?.numOffeatures === 0 || layer.features === null}
              onClick={() => onListItemClick(layer)}
            >
              {renderLayerIcon()}
              {renderLayerBody()}
              <Box
                sx={{
                  padding: isEnlarged ? '0.25rem' : '1rem',
                  paddingRight: isEnlarged ? '0.25rem' : '1rem',
                  [theme.breakpoints.down('xl')]: {
                    display: isEnlarged ? 'none !important' : 'block',
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
 * @param {boolean} isEnlarged Boolean value if right panel is enlarged or not.
 * @param {number} selectedLayerIndex  Current index of list item selected.
 * @param {string} selectedLayerPath  Selected path of the layer.
 * @param {Function} onListItemClick  Callback function excecuted when list item is clicked.
 * @returns
 */
export function LayerList({ layerList, isEnlarged, selectedLayerPath, onListItemClick }: LayerListProps) {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation<string>();

  return (
    <List sx={sxClasses.list}>
      {!!layerList.length &&
        layerList.map((layer) => (
          <LayerListItem
            key={layer.layerPath}
            // Reason:- (layer?.numOffeatures ?? 1) > 0
            // Some of layers will not have numOfFeatures, so to make layer look like selected, we need to set default value to 1.
            // Also we cant set numOfFeature initially, then it num of features will be display as sub title.
            isSelected={(layer?.numOffeatures ?? 1) > 0 && layer.layerPath === selectedLayerPath}
            isEnlarged={isEnlarged}
            layer={layer}
            onListItemClick={onListItemClick}
          />
        ))}
      {!layerList.length && (
        <LayerListItem
          key="dummyPath"
          isSelected={false}
          isEnlarged
          layer={
            {
              layerPath: '',
              layerName: t('layers.instructionsNoLayersTitle'),
              layerFeatures: t('layers.instructionsNoLayersBody'),
              layerStatus: 'processed',
              queryStatus: 'processed',
              numOffeatures: 0, // Just so it's disabled..
            } as LayerListEntry
          }
          onListItemClick={onListItemClick}
        />
      )}
    </List>
  );
}
