import type { ReactNode } from 'react';
import { memo, useCallback, useMemo, useState, useRef, useEffect, useId } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Box,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
  Typography,
  ProgressBar,
  LocationSearchingIcon,
  IconButton,
  VisibilityOffOutlinedIcon,
} from '@/ui';

import type { SxProps } from '@mui/material';
import type { SxStyles } from '@/ui/style/types';

import type { TypeFeatureInfoEntry, TypeQueryStatus } from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { getSxClasses } from './layer-list-style';
import { LayerIcon } from './layer-icon';
import { logger } from '@/core/utils/logger';
import { LAYER_PATH_COORDINATE_INFO } from '@/core/stores/states/feature-info-state';
import { useLayerController } from '@/core/controllers/use-controllers';

/** Represents an entry in the layer list. */
export interface LayerListEntry {
  /** Optional content to render inside the item. */
  content?: string | ReactNode;
  /** Display name of the layer. */
  layerName: string;
  /** Unique path identifying the layer. */
  layerPath: string;
  /** Current load status of the layer. */
  layerStatus: TypeLayerStatus;
  /** Current query status of the layer. */
  queryStatus: TypeQueryStatus;
  /** Formatted feature count string. */
  layerFeatures?: string;
  /** Optional icon indicating map filter is active. */
  mapFilteredIcon?: ReactNode;
  /** Optional tooltip content. */
  tooltip?: JSX.Element | string;
  /** Number of features in the layer. */
  numOffeatures?: number;
  /** Array of feature info entries. */
  features?: TypeFeatureInfoEntry[];
  /** Unique DOM id for the layer list item. */
  layerUniqueId?: string;
  /** Whether the layer item is disabled. */
  isDisabled?: boolean;
  /** Whether the layer is hidden on the map (visibility toggled off); rendered disabled under the "Hidden layers" section with an inline eye toggle. */
  isHidden?: boolean;
  /** Layer paths to make visible when the inline eye toggle is clicked (defaults to `[layerPath]`); used to re-enable every layer backing a multi-layer entry such as a custom time slider. */
  relatedLayerPaths?: string[];
}

/** Properties for the LayerList component. */
interface LayerListProps {
  /** Array of layer entries to render. */
  layerList: LayerListEntry[];
  /** Path of the currently selected layer. */
  selectedLayerPath: string | undefined;
  /** Callback invoked when a layer item is clicked. */
  onListItemClick: (layer: LayerListEntry) => void;
  /** Compact mode for the collapsed app-bar icon view: hides the section headings and the "no layers" instructions item. */
  compact?: boolean;
  /** Omits the available-layers heading for non-layer lists such as Guide topics. */
  hideAvailableHeading?: boolean;
}

/** Properties for the LayerListItem component. */
interface LayerListItemProps {
  /** The unique DOM id for this list item. */
  id: string;
  /** Whether this item is currently selected. */
  isSelected: boolean;
  /** The layer entry data to render. */
  layer: LayerListEntry;
  /** Callback invoked when the item is clicked. */
  onListItemClick: (layer: LayerListEntry) => void;
}

/**
 * Renders a single layer list item with icon, status, and selection state.
 *
 * Memoized to avoid re-rendering all items when only the selected layer changes.
 * When only one layer's `isSelected` state changes in the list, the other N-1 items
 * skip re-rendering thanks to memo shallow comparison.
 *
 * @param props - Properties defined in LayerListItemProps interface
 * @returns The layer list item element
 */
export const LayerListItem = memo(({ id, isSelected, layer, onListItemClick }: LayerListItemProps): JSX.Element => {
  // Log
  logger.logTraceRender('components/common/layer-list > LayerListItem');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const layerController = useLayerController();

  /**
   * Builds the sx classes for the layer list item component.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('LAYER-LIST - LayerListItem - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Deconstruct the layer object into immutable variables to be used by this component and its hooks
  const {
    layerPath,
    layerName,
    layerStatus,
    tooltip,
    layerFeatures,
    queryStatus,
    numOffeatures,
    mapFilteredIcon,
    isDisabled: propIsDisabled,
    isHidden,
    relatedLayerPaths,
    content,
  } = layer;

  // Internal state - WCAG accessibility for screen reader announcements
  const prevStatusRef = useRef<string | undefined>(undefined); // Ref to track previous status for status change detection
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Style
  const containerClass = [
    'layer-panel',
    'bordered',
    layerStatus ?? '',
    `query-${queryStatus}`,
    isSelected ? 'selectedLayer bordered-primary' : '',
  ]
    .join(' ')
    .trim();

  // Constant for state
  const isLoading = queryStatus === 'processing' || layerStatus === 'loading' || layerStatus === 'processing';
  const isLayerCoordinateInfo = layerPath === LAYER_PATH_COORDINATE_INFO;

  // Default disabled state - hidden layers are NOT disabled (they are enabled but hidden; the "Hidden layers"
  // heading and the eye toggle convey that state). The 0-feature rule only greys non-hidden layers, so hidden
  // rows stay full-contrast and consistent across panels regardless of their (irrelevant) selected-feature count.
  let isDisabled = isLoading || propIsDisabled || (!isHidden && numOffeatures === 0);

  // If it's the layer coordinate info, it's never disabled, because it always at least have the clicked map coordinates information.
  // However, if "coordinateInfoEnabled" is true, and no map click has been done,the layer coord info will show zero-ed out coordinates in the UI.
  if (isLayerCoordinateInfo) isDisabled = false;

  /**
   * Computes the layer status text for tooltip (plain text only).
   */
  const memoLayerStatusText = useMemo((): string => {
    logger.logTraceUseMemo('LAYER-LIST - LayerListItem - memoLayerStatusText', layerStatus, queryStatus, layerFeatures);

    if (layerStatus === 'error' || queryStatus === 'error') {
      return t('legend.layerError');
    }
    if (queryStatus === 'processing') {
      return t('layers.querying');
    }
    // Return plain text feature count (layerFeatures is already a string from details-panel)
    return layerFeatures ?? '';
  }, [layerStatus, queryStatus, layerFeatures, t]);

  /**
   * Computes the tooltip title with layer name and status.
   */
  const memoTooltipTitle = useMemo((): ReactNode => {
    logger.logTraceUseMemo('LAYER-LIST - LayerListItem - memoTooltipTitle', tooltip, memoLayerStatusText, isDisabled);

    // No tooltip when disabled (text wraps and is fully visible)
    if (isDisabled) {
      return undefined;
    }

    // If tooltip is a JSX.Element/ReactNode, pass it through as-is
    if (tooltip && typeof tooltip !== 'string') {
      return tooltip;
    }

    // Handle string tooltips with status concatenation
    const baseTitle = typeof tooltip === 'string' ? tooltip : '';
    const hasStatusText = typeof memoLayerStatusText === 'string' && memoLayerStatusText.trim().length > 0;

    if (hasStatusText) {
      // If no base title, return status text alone; otherwise use localized format with status
      return baseTitle.trim() ? t('layers.layerTooltipWithStatus', { title: baseTitle, status: memoLayerStatusText }) : memoLayerStatusText;
    }

    return baseTitle || undefined;
  }, [tooltip, memoLayerStatusText, isDisabled, t]);

  const hasTooltip = !!memoTooltipTitle;

  // #region Handlers

  /**
   * Gets the layer status label based on query and layer status.
   *
   * @returns The status label as JSX element or string
   */
  const getLayerStatus = useCallback((): JSX.Element | string => {
    // If there's a map filter icon, wrap text with icon in JSX
    if (mapFilteredIcon) {
      return (
        <>
          {memoLayerStatusText} {mapFilteredIcon}
        </>
      );
    }
    // Otherwise return plain text
    return memoLayerStatusText;
  }, [memoLayerStatusText, mapFilteredIcon]);

  /**
   * Handles the inline eye toggle (and the whole hidden row) that re-enables the hidden layer's map visibility.
   *
   * Re-enables every layer backing the entry (e.g. all layers of a custom time slider), not just the main path,
   * and crawls up each layer's parent groups so a child hidden only because its group is hidden becomes visible.
   * Selects the layer afterwards so its content opens in the right panel and focus follows the selection (WCAG).
   */
  const handleShowLayer = useCallback((): void => {
    const pathsToShow = relatedLayerPaths?.length ? relatedLayerPaths : [layerPath];
    pathsToShow.forEach((path) => layerController.setLayerVisibleIncludingParents(path));

    // Only select when the layer has content to show (undefined feature count means panels without a feature concept,
    // e.g. time slider); selecting a feature-less layer would replace the guide with an empty right panel.
    if (numOffeatures !== 0) {
      onListItemClick(layer);
    }
  }, [layerController, layerPath, relatedLayerPaths, onListItemClick, layer, numOffeatures]);

  /**
   * Handles the item click for a visible layer (hidden rows are non-interactive; only their eye toggle acts).
   */
  const handleItemClick = useCallback((): void => {
    onListItemClick(layer);
  }, [onListItemClick, layer]);

  /**
   * Handles item activation with the keyboard (Enter or Spacebar).
   */
  const handleLayerKeyDown = useCallback(
    (event: React.KeyboardEvent): void => {
      if ((event.key === 'Enter' || event.key === ' ') && !isDisabled && !isLoading) {
        handleItemClick();
        // NOTE: did this, bcz when enter is clicked, tab component `handleClick` function is fired,
        // to avoid this we have do prevent default so that it doesn't propagate to the parent elements.
        event.preventDefault();
      }
    },
    [isDisabled, isLoading, handleItemClick]
  );

  // #endregion Handlers

  /**
   * WCAG - Tracks layer status changes for screen reader announcements.
   */
  useEffect(() => {
    logger.logTraceUseEffect('LAYER-LIST - LayerListItem - WCAG track layer status changes', layerStatus);

    // Helper to check if previous state was an in-progress state (loading or processing).
    // Both states indicate the layer is being loaded, so completion/error announcements
    // should trigger from either state to ensure screen readers don't miss status changes.
    const prevStateWasInProgress = prevStatusRef.current === 'loading' || prevStatusRef.current === 'processing';

    if (layerStatus === 'loading' && prevStatusRef.current !== 'loading') {
      // Announce when loading starts
      setStatusMessage(t('layers.status.layerLoadingDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else if (layerStatus === 'processing' && prevStatusRef.current !== 'processing') {
      // Announce when processing starts (distinct phase after initial load)
      setStatusMessage(t('layers.status.layerProcessingDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else if (layerStatus === 'loaded' && prevStateWasInProgress) {
      // Announce when layer completes successfully from any in-progress state (loading or processing).
      // This ensures transitions like processing→loaded are announced, not just loading→loaded.
      setStatusMessage(t('layers.status.layerLoadedDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else if (layerStatus === 'error' && prevStateWasInProgress) {
      // Announce when layer fails from any in-progress state (loading or processing).
      // This ensures transitions like processing→error are announced, not just loading→error.
      setStatusMessage(t('layers.status.layerErrorDescriptive', { layerName }) || '');
      prevStatusRef.current = layerStatus;
    } else {
      // Update ref for any other status changes (no announcement needed)
      prevStatusRef.current = layerStatus;
    }
  }, [layerStatus, layerName, t]);

  return (
    <ListItem className={containerClass}>
      {/* WCAG - ARIA live region for screen reader announcements */}
      <Box sx={memoSxClasses.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </Box>
      <Tooltip
        title={memoTooltipTitle ?? ''}
        placement="top"
        arrow
        enterDelay={theme.transitions.duration.tooltipDelay}
        enterNextDelay={theme.transitions.duration.tooltipDelay}
        disableHoverListener={!hasTooltip}
        disableFocusListener={!hasTooltip}
        disableTouchListener={!hasTooltip}
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
        <ListItemButton
          id={id}
          component="button"
          sx={[memoSxClasses.listItemButton, !!isHidden && memoSxClasses.listItemButtonHidden] as SxProps}
          onKeyDown={isHidden ? undefined : handleLayerKeyDown}
          onClick={isHidden ? undefined : handleItemClick}
          selected={isSelected}
          disabled={isDisabled}
          disableRipple={isHidden}
          tabIndex={isHidden ? -1 : undefined}
          aria-current={isSelected ? true : undefined}
        >
          {layerPath === LAYER_PATH_COORDINATE_INFO ? (
            <LocationSearchingIcon />
          ) : (
            layerPath && !content && <LayerIcon layerPath={layerPath} />
          )}
          {/* Reserve right space for the inline eye toggle so the wrapped layer name doesn't run under it */}
          <Box
            component="span"
            sx={[memoSxClasses.listPrimaryText, !!isHidden && memoSxClasses.listPrimaryTextHidden] as SxProps}
            className="layerInfo"
          >
            <Typography component="span" className="layerTitle" noWrap={!isDisabled}>
              {layerName}
            </Typography>
            <Box component="span" sx={{ display: 'flex', alignContent: 'center' }}>
              <Typography component="span" variant="subtitle1" noWrap={!isDisabled} sx={{ display: 'block' }}>
                {getLayerStatus()}
              </Typography>
            </Box>
          </Box>
          {layerPath !== LAYER_PATH_COORDINATE_INFO && (numOffeatures ?? 0) > 0 && (
            <Badge
              badgeContent={numOffeatures}
              max={99}
              color="info"
              sx={memoSxClasses.layerCount}
              className="layer-count"
              aria-hidden="true"
            ></Badge>
          )}
        </ListItemButton>
      </Tooltip>
      {isHidden && (
        <IconButton
          edge="end"
          size="small"
          sx={memoSxClasses.showHiddenLayerButton}
          aria-label={t('layers.showLayer', { name: layerName })}
          tooltip={t('layers.showLayer', { name: layerName })}
          onClick={handleShowLayer}
        >
          <VisibilityOffOutlinedIcon />
        </IconButton>
      )}
      {(layerStatus === 'loading' || queryStatus === 'processing') && (
        <Box component="span" sx={memoSxClasses.progressBar}>
          <ProgressBar
            aria-label={queryStatus === 'processing' ? t('layers.querying') : t('layers.status.layerLoadingDescriptive', { layerName })}
          />
        </Box>
      )}
    </ListItem>
  );
});
LayerListItem.displayName = 'LayerListItem';

/**
 * Renders a list of layers with selection and status indicators.
 *
 * Memoized to prevent re-rendering when unrelated parent state changes (e.g., other UI updates).
 * While `selectedLayerPath` and `layerList` do change frequently on layer interactions, memo
 * protects against unnecessary renders triggered by parent component updates that don't affect
 * these props. The shallow comparison overhead is minimal compared to rendering all list items.
 *
 * @param props - Properties defined in LayerListProps interface
 * @returns The layer list element
 */
export const LayerList = memo((props: LayerListProps): JSX.Element => {
  // Log
  logger.logTraceRender('components/common/layer-list > LayerList');

  const { layerList, selectedLayerPath, onListItemClick, compact, hideAvailableHeading } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  // Unique ids so each list can be labelled by its own heading (WCAG - aria-labelledby)
  const availableHeadingId = useId();
  const hiddenHeadingId = useId();

  // WCAG - live-region message announcing when a layer moves between the available and hidden lists
  const [announcement, setAnnouncement] = useState<string>('');
  const prevHiddenPathsRef = useRef<Set<string> | undefined>(undefined);

  /**
   * Builds the sx classes for the layer list component.
   */
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('LAYER-LIST - LayerList - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  /**
   * Splits the layer list into available and hidden groups while preserving order within each group.
   */
  const memoGroupedLayers = useMemo((): { availableLayers: LayerListEntry[]; hiddenLayers: LayerListEntry[] } => {
    logger.logTraceUseMemo('LAYER-LIST - LayerList - memoGroupedLayers', layerList);
    return {
      availableLayers: layerList.filter((layer) => !layer.isHidden),
      hiddenLayers: layerList.filter((layer) => layer.isHidden),
    };
  }, [layerList]);

  const hasHiddenLayers = !!memoGroupedLayers.hiddenLayers.length;

  /**
   * Renders a single layer list item.
   *
   * @param layer - The layer entry to render
   * @returns The layer list item element
   */
  const renderLayerListItem = useCallback(
    (layer: LayerListEntry): JSX.Element => (
      <LayerListItem
        id={`${layer?.layerUniqueId ?? ''}`}
        key={layer.layerPath}
        // Reason:- (layer?.numOffeatures ?? 1) > 0
        // Some of layers will not have numOfFeatures, so to make layer look like selected, we need to set default value to 1.
        // Also we cant set numOfFeature initially, then it num of features will be display as sub title.
        isSelected={
          ((layer?.numOffeatures ?? 1) > 0 || layer.layerPath === LAYER_PATH_COORDINATE_INFO) && layer.layerPath === selectedLayerPath
        }
        layer={layer}
        onListItemClick={onListItemClick}
      />
    ),
    [selectedLayerPath, onListItemClick]
  );

  /**
   * WCAG - announces to screen readers when a layer moves between the available and hidden lists.
   */
  useEffect(() => {
    logger.logTraceUseEffect('LAYER-LIST - LayerList - announce list moves', memoGroupedLayers.hiddenLayers.length);

    const currentHiddenPaths = new Set(memoGroupedLayers.hiddenLayers.map((layer) => layer.layerPath));
    const prevHiddenPaths = prevHiddenPathsRef.current;

    // Skip the first render (no previous snapshot to compare against)
    if (prevHiddenPaths) {
      const movedToHidden = memoGroupedLayers.hiddenLayers.find((layer) => !prevHiddenPaths.has(layer.layerPath));
      const movedToAvailable = memoGroupedLayers.availableLayers.find((layer) => prevHiddenPaths.has(layer.layerPath));

      if (movedToHidden) setAnnouncement(t('layers.layerMovedToHidden', { name: movedToHidden.layerName }));
      else if (movedToAvailable) setAnnouncement(t('layers.layerMovedToAvailable', { name: movedToAvailable.layerName }));
    }

    prevHiddenPathsRef.current = currentHiddenPaths;
  }, [memoGroupedLayers, t]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* WCAG - ARIA live region announcing when a layer moves between the two lists */}
      <Box sx={memoSxClasses.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </Box>

      {!compact && !hideAvailableHeading && (
        <Typography id={availableHeadingId} sx={memoSxClasses.listSectionHeader} component="p">
          {t('layers.availableLayersSection')}
        </Typography>
      )}
      <List sx={memoSxClasses.list} aria-labelledby={compact || hideAvailableHeading ? undefined : availableHeadingId}>
        {memoGroupedLayers.availableLayers.map(renderLayerListItem)}
        {!memoGroupedLayers.availableLayers.length && !compact && (
          <LayerListItem
            id="dummyPath"
            key="dummyPath"
            isSelected={false}
            layer={{
              layerPath: '',
              layerName: t('layers.instructionsNoLayersTitle'),
              layerFeatures: t('layers.instructionsNoLayersBody'),
              layerStatus: 'processed',
              queryStatus: 'processed',
              numOffeatures: 0, // Just so it's disabled.
            }}
            onListItemClick={onListItemClick}
          />
        )}
      </List>

      {hasHiddenLayers && (
        <>
          <Typography id={hiddenHeadingId} sx={memoSxClasses.listSectionHeader} component="p">
            {t('layers.hiddenLayersSection')}
          </Typography>
          <List sx={memoSxClasses.list} aria-labelledby={hiddenHeadingId}>
            {memoGroupedLayers.hiddenLayers.map(renderLayerListItem)}
          </List>
        </>
      )}
    </Box>
  );
});
LayerList.displayName = 'LayerList';
