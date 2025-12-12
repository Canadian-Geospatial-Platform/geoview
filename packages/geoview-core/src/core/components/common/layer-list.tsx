import type { ReactNode } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Badge, Box, List, ListItem, ListItemButton, Tooltip, Typography, ProgressBar, LocationSearchingIcon } from '@/ui';

import type { TypeFeatureInfoEntry, TypeQueryStatus } from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { getSxClasses } from './layer-list-style';
import { LayerIcon } from './layer-icon';
import { logger } from '@/core/utils/logger';
import { useLayerSelectorStatus } from '@/core/stores/store-interface-and-intial-values/layer-state';

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
  isDisabled?: boolean;
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
// TODO: Unmemoize this component, probably, because it's in 'common' folder
export const LayerListItem = memo(function LayerListItem({ id, isSelected, layer, onListItemClick }: LayerListItemProps) {
  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const layerStatus = useLayerSelectorStatus(layer.layerPath);

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
  const isDisabled = layer?.numOffeatures === 0 || layer?.features === null || layer?.isDisabled;
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
   * Handle layer selection with keyboard (Enter or Spacebar).
   */
  const handleLayerKeyDown = useCallback(
    (event: React.KeyboardEvent, selectedLayer: LayerListEntry): void => {
      // Log
      logger.logTraceUseCallback('LAYER-LIST - handleLayerKeyDown');

      if ((event.key === 'Enter' || event.key === ' ') && !isDisabled && !isLoading) {
        onListItemClick(selectedLayer);
        // NOTE: did this, bcz when enter is clicked, tab component `handleClick` function is fired,
        // to avoid this we have do prevent default so that it doesn't propagate to the parent elements.
        event.preventDefault();
      }
    },
    [isDisabled, isLoading, onListItemClick]
  );

  // TODO: WCAG Issue #3116 Finish implementing button styles to be consistent with rest of the app (keyboard focus))

  return (
    <Tooltip title={layer.tooltip} placement="top" arrow>
      <ListItem id={id} disablePadding>
        <ListItemButton
          component="button"
          sx={sxClasses.listItemButton}
          className={containerClass}
          onKeyDown={(e) => handleLayerKeyDown(e, layer)}
          onClick={() => onListItemClick(layer)}
          selected={isSelected}
          // disable when layer features has null value.
          disabled={isDisabled || isLoading}
          aria-disabled={isDisabled || isLoading}
        >
          {layer.layerPath === 'coordinate-info' ? (
            // Treat
            <LocationSearchingIcon />
          ) : (
            layer.layerPath && !layer.content && <LayerIcon layerPath={layer.layerPath} />
          )}
          <Box component="span" sx={sxClasses.listPrimaryText} className="layerInfo">
            <Typography component="span" className="layerTitle">
              {layer.layerName}
            </Typography>
            <Box component="span" display="flex" alignContent="center">
              <Typography component="span" variant="subtitle1" noWrap display="block">
                {getLayerStatus()}
              </Typography>
            </Box>
          </Box>
          {layer.layerPath !== 'coordinate-info' && (layer.numOffeatures ?? 0) > 0 && (
            <Badge badgeContent={layer.numOffeatures} max={99} color="info" sx={sxClasses.layerCount} className="layer-count"></Badge>
          )}
        </ListItemButton>
        {layerStatus === 'loading' && (
          <Box component="span" sx={sxClasses.progressBar}>
            <ProgressBar />
          </Box>
        )}
      </ListItem>
    </Tooltip>
  );
});

/**
 * Create a list of layers
 * @param {LayerListEntry} layerList  Array of layer list entries.
 * @param {boolean} isEnlarged Boolean value if right panel is enlarged or not.
 * @param {number} selectedLayerIndex  Current index of list item selected.
 * @param {string} selectedLayerPath  Selected path of the layer.
 * @param {Function} onListItemClick  Callback function executed when list item is clicked.
 * @returns {JSX.Element}
 */
// Memoizes entire component, preventing re-renders if props haven't changed
// TODO: Unmemoize this component, probably, because it's in 'common' folder
export const LayerList = memo(function LayerList({ layerList, selectedLayerPath, onListItemClick }: LayerListProps): JSX.Element {
  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // TODO: WCAG Issue #3119 Place in a landmark region (nav)
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
