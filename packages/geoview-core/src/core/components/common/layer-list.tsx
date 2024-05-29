import { ReactNode, memo, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { animated, useSpring } from '@react-spring/web';
import { Box, List, ListItem, ListItemButton, ListItemIcon, Paper, Tooltip, Typography } from '@/ui';
import { TypeFeatureInfoEntry, TypeQueryStatus, TypeLayerStatus } from '@/geo/map/map-schema-types';
import { getSxClasses } from './layer-list-style';
import { LayerIcon } from './layer-icon';

export interface LayerListEntry {
  content?: string | ReactNode;
  layerName: string;
  layerPath: string;
  layerStatus: TypeLayerStatus;
  queryStatus: TypeQueryStatus;
  layerFeatures?: ReactNode;
  mapFilteredIcon?: ReactNode;
  tooltip?: JSX.Element | string;
  numOffeatures?: number;
  features?: TypeFeatureInfoEntry[] | undefined | null;
}

interface LayerListProps {
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onListItemClick: (layer: LayerListEntry) => void;
}

interface LayerListItemProps {
  isSelected: boolean;
  layer: LayerListEntry;
  onListItemClick: (layer: LayerListEntry) => void;
  layerIndex: number;
}

const LayerListItem = memo(function LayerListItem({ isSelected, layer, onListItemClick, layerIndex }: LayerListItemProps) {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation<string>();

  const isDisabled = layer?.numOffeatures === 0 || layer?.features === null;

  const isLoading =
    layer?.numOffeatures === 0 ||
    layer?.features === null ||
    layer.queryStatus === 'processing' ||
    layer.layerStatus === 'loading' ||
    layer.layerStatus === 'processing';

  /**
   * Render Layer Icon based on layerPath
   * @returns
   */
  const renderLayerIcon = (): JSX.Element | null => {
    if (layer.layerPath) {
      return (
        <ListItemIcon aria-hidden="true">
          <LayerIcon layer={layer} />
        </ListItemIcon>
      );
    }
    return null;
  };

  /**
   * Get layer status based on query status and layer status
   */
  const getLayerStatus = useCallback((): JSX.Element | string => {
    if (layer.layerStatus === 'error' || layer?.queryStatus === 'error') {
      return `${t('legend.layerError')}`;
    }
    if (['init', 'processing'].includes(layer.queryStatus)) {
      return `${t('layers.querying')}...`;
    }
    return (
      <>
        {layer.layerFeatures} {layer?.mapFilteredIcon ?? ''}
      </>
    );
  }, [layer, t]);

  /**
   * Render Layer body.
   * @returns JSX.Element
   */
  const renderLayerBody = (): JSX.Element => {
    return (
      <Box sx={sxClasses.listPrimaryText}>
        <Typography className="layerTitle">{layer.layerName}</Typography>
        <Box display="flex" alignContent="center">
          <Typography component="p" variant="subtitle1" noWrap display="flex">
            {getLayerStatus()}
          </Typography>
        </Box>
      </Box>
    );
  };

  function getContainerClass(): string {
    const result: string[] = ['layer-panel', 'bordered', layer.layerStatus ?? '', `query-${layer.queryStatus}`];

    // if layer has selected child but its not itself selected
    if (isSelected) {
      result.push('selectedLayer bordered-primary');
    }
    return result.join(' ');
  }

  const listItemSpring = useSpring({
    delay: layerIndex * 150,
    from: { opacity: 0.1 },
    to: { opacity: 1 },
  });

  /**
   * Handle layer click when mouse enter is pressed.
   */
  const handleLayerKeyDown = useCallback(
    (e: React.KeyboardEvent, selectedLayer: LayerListEntry): void => {
      if (e.key === 'Enter') onListItemClick(selectedLayer);
    },
    [onListItemClick]
  );

  const AnimatedPaper = animated(Paper);

  return (
    <AnimatedPaper sx={{ marginBottom: '1rem' }} style={listItemSpring} className={getContainerClass()}>
      <Tooltip title={layer.tooltip} placement="top" arrow>
        <Box>
          <ListItem disablePadding onKeyDown={(e) => handleLayerKeyDown(e, layer)} tabIndex={0}>
            <ListItemButton
              tabIndex={-1}
              selected={isSelected}
              // disable when layer features has null value.
              disabled={isDisabled || isLoading}
              onClick={() => onListItemClick(layer)}
              aria-label={layer.layerName}
            >
              {renderLayerIcon()}
              {renderLayerBody()}
            </ListItemButton>
          </ListItem>
        </Box>
      </Tooltip>
    </AnimatedPaper>
  );
});

/**
 * Create a list of layers
 * @param {LayerListEntry} layerList  Array of layer list entries.
 * @param {boolean} isEnlarged Boolean value if right panel is enlarged or not.
 * @param {number} selectedLayerIndex  Current index of list item selected.
 * @param {string} selectedLayerPath  Selected path of the layer.
 * @param {Function} onListItemClick  Callback function excecuted when list item is clicked.
 * @returns {JSX.Element}
 */
export function LayerList({ layerList, selectedLayerPath, onListItemClick }: LayerListProps): JSX.Element {
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const { t } = useTranslation<string>();

  return (
    <List sx={sxClasses.list}>
      {!!layerList.length &&
        layerList.map((layer, ind) => (
          <LayerListItem
            key={layer.layerPath}
            // Reason:- (layer?.numOffeatures ?? 1) > 0
            // Some of layers will not have numOfFeatures, so to make layer look like selected, we need to set default value to 1.
            // Also we cant set numOfFeature initially, then it num of features will be display as sub title.
            isSelected={(layer?.numOffeatures ?? 1) > 0 && layer.layerPath === selectedLayerPath}
            layer={layer}
            onListItemClick={onListItemClick}
            layerIndex={ind}
          />
        ))}
      {!layerList.length && (
        <LayerListItem
          key="dummyPath"
          isSelected={false}
          layerIndex={0}
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
