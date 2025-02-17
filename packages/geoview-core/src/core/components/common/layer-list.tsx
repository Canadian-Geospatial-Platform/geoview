import { ReactNode, memo, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { animated } from '@react-spring/web';
import { Box, List, ListItem, ListItemButton, Paper, Tooltip, Typography } from '@/ui';
import { TypeFeatureInfoEntry, TypeQueryStatus, TypeLayerStatus } from '@/geo/map/map-schema-types';
import { getSxClasses } from './layer-list-style';
import { LayerIcon } from './layer-icon';
import { logger } from '@/core/utils/logger';

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
  layerUniqueId?: string;
}

interface LayerListProps {
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onListItemClick: (layer: LayerListEntry) => void;
}

interface LayerListItemProps {
  id: string;
  isSelected: boolean;
  layer: LayerListEntry;
  onListItemClick: (layer: LayerListEntry) => void;
}

// Memoizes entire component, preventing re-renders if props haven't changed
export const LayerListItem = memo(function LayerListItem({ id, isSelected, layer, onListItemClick }: LayerListItemProps) {
  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Style
  const containerClass = [
    'layer-panel',
    'bordered',
    layer.layerStatus ?? '',
    `query-${layer.queryStatus}`,
    isSelected ? 'selectedLayer bordered-primary' : '',
  ]
    .join(' ')
    .trim();

  // Constant for state
  const isDisabled = layer?.numOffeatures === 0 || layer?.features === null;
  const isLoading =
    layer?.numOffeatures === 0 ||
    layer?.features === null ||
    layer.queryStatus === 'processing' ||
    layer.layerStatus === 'loading' ||
    layer.layerStatus === 'processing';

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
  }, [layer.layerFeatures, layer.layerStatus, layer?.mapFilteredIcon, layer.queryStatus, t]);

  /**
   * Handle layer click when mouse enter is pressed.
   */
  const handleLayerKeyDown = useCallback(
    (event: React.KeyboardEvent, selectedLayer: LayerListEntry): void => {
      // Log
      logger.logTraceUseCallback('LAYER-LIST - handleLayerKeyDown');

      if (event.key === 'Enter' && !isDisabled) {
        onListItemClick(selectedLayer);
        // NOTE: did this, bcz when enter is clicked, tab component `handleClick` function is fired,
        // to avoid this we have do prevent default so that it doesn't probagate to the parent elements.
        event.preventDefault();
      }
    },
    [isDisabled, onListItemClick]
  );

  const AnimatedPaper = animated(Paper);

  return (
    <AnimatedPaper sx={{ marginBottom: '1rem' }} className={containerClass}>
      <Tooltip title={layer.tooltip} placement="top" arrow>
        <Box>
          <ListItem
            disablePadding
            onKeyDown={(e) => handleLayerKeyDown(e, layer)}
            onClick={() => onListItemClick(layer)}
            tabIndex={0}
            id={id}
          >
            <ListItemButton
              tabIndex={-1}
              selected={isSelected}
              // disable when layer features has null value.
              disabled={isDisabled || isLoading}
              aria-label={layer.layerName}
            >
              {layer.layerPath && !layer.content && <LayerIcon layer={layer} />}
              <Box sx={sxClasses.listPrimaryText}>
                <Typography className="layerTitle">{layer.layerName}</Typography>
                <Box display="flex" alignContent="center">
                  <Typography component="p" variant="subtitle1" noWrap display="block">
                    {getLayerStatus()}
                  </Typography>
                </Box>
              </Box>
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
// Memoizes entire component, preventing re-renders if props haven't changed
export const LayerList = memo(function LayerList({ layerList, selectedLayerPath, onListItemClick }: LayerListProps): JSX.Element {
  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  return (
    <List sx={sxClasses.list}>
      {!!layerList.length &&
        layerList.map((layer) => (
          <LayerListItem
            id={`${layer?.layerUniqueId ?? ''}`}
            key={layer.layerPath}
            // Reason:- (layer?.numOffeatures ?? 1) > 0
            // Some of layers will not have numOfFeatures, so to make layer look like selected, we need to set default value to 1.
            // Also we cant set numOfFeature initially, then it num of features will be display as sub title.
            isSelected={(layer?.numOffeatures ?? 1) > 0 && layer.layerPath === selectedLayerPath}
            layer={layer}
            onListItemClick={onListItemClick}
          />
        ))}
      {!layerList.length && (
        <LayerListItem
          id="dummyPath"
          key="dummyPath"
          isSelected={false}
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
});
