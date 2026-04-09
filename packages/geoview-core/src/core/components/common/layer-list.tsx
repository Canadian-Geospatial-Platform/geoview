import type { ReactNode } from 'react';
import { memo, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { Badge, Box, List, ListItem, ListItemButton, Tooltip, Typography, ProgressBar, LocationSearchingIcon } from '@/ui';

import type { TypeFeatureInfoEntry, TypeQueryStatus } from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { getSxClasses } from './layer-list-style';
import { LayerIcon } from './layer-icon';
import { useStoreLayerStatus } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { logger } from '@/core/utils/logger';
import { LAYER_PATH_COORDINATE_INFO, useStoreDetailsQueryStatus } from '@/core/stores/store-interface-and-intial-values/feature-info-state';

/** Represents an entry in the layer list. */
export interface LayerListEntry {
  content?: string | ReactNode;
  layerName: string;
  layerPath: string;
  layerStatus: TypeLayerStatus;
  queryStatus: TypeQueryStatus;
  layerFeatures?: string;
  mapFilteredIcon?: ReactNode;
  tooltip?: JSX.Element | string;
  numOffeatures?: number;
  features?: TypeFeatureInfoEntry[] | undefined;
  layerUniqueId?: string;
  isDisabled?: boolean;
}

/** Properties for the LayerList component. */
interface LayerListProps {
  layerList: LayerListEntry[];
  selectedLayerPath: string | undefined;
  onListItemClick: (layer: LayerListEntry) => void;
}

/** Properties for the LayerListItem component. */
interface LayerListItemProps {
  id: string;
  isSelected: boolean;
  layer: LayerListEntry;
  onListItemClick: (layer: LayerListEntry) => void;
}

/**
 * Renders a single layer list item with icon, status, and selection state.
 *
 * Memoized to avoid re-rendering all items when only the selected layer changes.
 *
 * @param props - LayerListItem properties
 * @returns The layer list item element
 */
export const LayerListItem = memo(function LayerListItem({ id, isSelected, layer, onListItemClick }: LayerListItemProps): JSX.Element {
  // Log
  logger.logTraceRender('components/common/layer-list > LayerListItem');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  // TODO: REFACTOR - The whole 'layer' parameter received in the component parameters list should be reviewed and turned obsolete.
  // TO.DOCONT: It should all be using store selector hooks instead. Fallback to layer query status if details query status is not available for now.
  const layerStatus = useStoreLayerStatus(layer.layerPath) ?? layer.layerStatus;
  const layerQueryStatus = useStoreDetailsQueryStatus(layer.layerPath) ?? layer.queryStatus;

  // Style
  const containerClass = [
    'layer-panel',
    'bordered',
    layerStatus ?? '',
    `query-${layerQueryStatus}`,
    isSelected ? 'selectedLayer bordered-primary' : '',
  ]
    .join(' ')
    .trim();

  // Constant for state
  const isLoading = layerQueryStatus === 'processing' || layerStatus === 'loading' || layerStatus === 'processing';
  const isLayerCoordinateInfo = layer.layerPath === LAYER_PATH_COORDINATE_INFO;

  // Default disabled state
  let isDisabled = isLoading || layer?.isDisabled || layer?.numOffeatures === 0;

  // If it's the layer coordinate info, it's never disabled, because it always at least have the clicked map coordinates information.
  // However, if "coordinateInfoEnabled" is true, and no map click has been done,the layer coord info will show zero-ed out coordinates in the UI.
  if (isLayerCoordinateInfo) isDisabled = false;

  /**
   * Gets the layer status label based on query and layer status.
   */
  const getLayerStatus = useCallback((): JSX.Element | string => {
    if (layerStatus === 'error' || layerQueryStatus === 'error') {
      return `${t('legend.layerError')}`;
    }
    if (['processing'].includes(layerQueryStatus)) {
      return `${t('layers.querying')}...`;
    }
    return (
      <>
        {layer.layerFeatures ?? ''} {layer?.mapFilteredIcon ?? ''}
      </>
    );
  }, [layer.layerFeatures, layerStatus, layer?.mapFilteredIcon, layerQueryStatus, t]);

  /**
   * Handles layer selection with keyboard (Enter or Spacebar).
   */
  const handleLayerKeyDown = useCallback(
    (event: React.KeyboardEvent, selectedLayer: LayerListEntry): void => {
      if ((event.key === 'Enter' || event.key === ' ') && !isDisabled && !isLoading) {
        onListItemClick(selectedLayer);
        // NOTE: did this, bcz when enter is clicked, tab component `handleClick` function is fired,
        // to avoid this we have do prevent default so that it doesn't propagate to the parent elements.
        event.preventDefault();
      }
    },
    [isDisabled, isLoading, onListItemClick]
  );

  return (
    <Tooltip
      title={layer.tooltip}
      placement="top"
      arrow
      enterDelay={theme.transitions.duration.tooltipDelay}
      enterNextDelay={theme.transitions.duration.tooltipDelay}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, -8],
              },
            },
          ],
        },
      }}
    >
      <ListItem disablePadding className={containerClass}>
        <ListItemButton
          id={id}
          component="button"
          sx={sxClasses.listItemButton}
          onKeyDown={(e) => handleLayerKeyDown(e, layer)}
          onClick={() => onListItemClick(layer)}
          selected={isSelected}
          disabled={isDisabled}
        >
          {layer.layerPath === LAYER_PATH_COORDINATE_INFO ? (
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
          {layer.layerPath !== LAYER_PATH_COORDINATE_INFO && (layer.numOffeatures ?? 0) > 0 && (
            <Badge badgeContent={layer.numOffeatures} max={99} color="info" sx={sxClasses.layerCount} className="layer-count" aria-hidden="true"></Badge>
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
 * Renders a list of layers with selection and status indicators.
 *
 * @param props - LayerList properties
 * @returns The layer list element
 */
// TODO: Remove memo — props (selectedLayerPath, layerList) change on every layer interaction, so memo adds overhead with no benefit
export const LayerList = memo(function LayerList({ layerList, selectedLayerPath, onListItemClick }: LayerListProps): JSX.Element {
  // Log
  logger.logTraceRender('components/common/layer-list > LayerList');

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
