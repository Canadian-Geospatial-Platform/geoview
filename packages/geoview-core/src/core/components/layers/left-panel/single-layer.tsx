import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { getSxClasses } from '@/core/components/common/layer-list-style';
import {
  Box,
  Collapse,
  IconButton,
  KeyboardArrowDownIcon,
  KeyboardArrowUpIcon,
  ListItem,
  ListItemButton,
  ListItemText,
  ProgressBar,
  Tooltip,
  VisibilityOffOutlinedIcon,
  VisibilityOutlinedIcon,
} from '@/ui';
import {
  useStoreLayerDisplayState,
  useStoreLayerSelectedLayerPath,
  useStoreLayerName,
  useStoreLayerId,
  useStoreLayerStatus,
  useStoreLayerEntryType,
  useStoreLayerControls,
  useStoreLayerChildPaths,
  useStoreLayerItems,
  useStoreLayerHasDisabledVisibility,
  useStoreLayerVisible,
  useStoreLayerInVisibleRange,
  useStoreLayerIsParentHiddenOnMap,
  useStoreLayerLegendCollapsed,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { DeleteUndoButton } from '@/core/components/layers/delete-undo-button';
import { LayersList } from './layers-list';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { logger } from '@/core/utils/logger';
import { ArrowDownwardIcon, ArrowUpIcon, CenterFocusScaleIcon, LoopIcon } from '@/ui/icons';
import { Divider } from '@/ui/divider/divider';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { scrollListItemIntoView } from '@/core/utils/utilities';
import { TIMEOUT, TABS } from '@/core/utils/constant';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useStoreUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useLayerController, useLayerCreatorController } from '@/core/controllers/use-controllers';

/** Static Tooltip slotProps — offset popper by [0, -8]. */
const TOOLTIP_SLOT_PROPS = {
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
};

interface SingleLayerProps {
  layerPath: string;
  depth: number;
  showLayerDetailsPanel: (layerId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isLayoutEnlarged: boolean;
  containerType: TypeContainerBox;
}

/**
 * Creates a single layer list item with controls and nested children.
 *
 * @param props - Properties defined in SingleLayerProps interface
 * @returns The single layer list item element
 */

export function SingleLayer({
  depth,
  layerPath,
  showLayerDetailsPanel,
  isFirst,
  isLast,
  isLayoutEnlarged,
  containerType,
}: SingleLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/single-layer', layerPath);

  // Hook
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('SINGLE-LAYER - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // Create ref for scrolling into view
  const layerListItemRef = useRef<HTMLLIElement>(null);

  // Ref to track if a reload has been requested
  const reloadRequestedRef = useRef<boolean>(false);

  // Get store states
  const mapId = useStoreGeoViewMapId();
  const selectedLayerPath = useStoreLayerSelectedLayerPath();
  const displayState = useStoreLayerDisplayState();
  const layerIsSelected = layerPath === selectedLayerPath && displayState === 'view';
  const isKeyboardNavigationMode = useStoreUIActiveTrapGeoView();

  const isVisible = useStoreLayerVisible(layerPath);
  const inVisibleRange = useStoreLayerInVisibleRange(layerPath);
  const legendExpanded = !useStoreLayerLegendCollapsed(layerPath);
  const parentHidden = useStoreLayerIsParentHiddenOnMap(layerPath);

  const layerId = useStoreLayerId(layerPath);
  const layerName = useStoreLayerName(layerPath);
  const layerStatus = useStoreLayerStatus(layerPath);
  const layerEntryType = useStoreLayerEntryType(layerPath);
  const layerControls = useStoreLayerControls(layerPath);
  const layerChildPaths = useStoreLayerChildPaths(layerPath);
  const layerItems = useStoreLayerItems(layerPath);
  const layerController = useLayerController();
  const layerCreatorController = useLayerCreatorController();

  // Build unique ID format
  const panelCloseButtonId = `${mapId}-${containerType}-${TABS.LAYERS}-panel-close-btn`;
  const layerListItemButtonId = `${mapId}-${containerType}-${TABS.LAYERS}-${layerPath}`;
  const reloadButtonId = `${mapId}-${containerType}-${layerPath}-reload-btn`;
  const orderUpButtonId = `${mapId}-${containerType}-${layerPath}-up-order-btn`;
  const orderDownButtonId = `${mapId}-${containerType}-${layerPath}-down-order-btn`;

  // Is zoom to visible scale button visible?
  const isZoomToVisibleScaleCapable = !inVisibleRange && layerEntryType !== 'group';
  const isZoomToVisibleScaleButton = layerControls?.visibleScale ?? false;

  // State to track if delete button should show for loading layers
  const [showDeleteOnLoading, setShowDeleteOnLoading] = useState(false);

  // State to track if the layer item has focus within for accessibility purposes
  const [hasFocusWithin, setHasFocusWithin] = useState(false);

  // Is visibility button disabled?
  const isLayerVisibleCapable = layerControls?.visibility;

  // Timer to show delete button after a delay for loading/processing layers so user can remove them to enable collapse/show all
  useEffect(() => {
    logger.logTraceUseEffect('SINGLE-LAYER - show delete button timer', layerStatus);

    if (layerStatus && ['newInstance', 'registered', 'processing', 'loading'].includes(layerStatus)) {
      const timer = setTimeout(() => {
        setShowDeleteOnLoading(true);
      }, TIMEOUT.deleteLayerLoading);

      return () => {
        clearTimeout(timer);
        setShowDeleteOnLoading(false);
      };
    }
    setShowDeleteOnLoading(false);
    return undefined;
  }, [layerStatus]);

  // Scroll this list item into view if selected
  useEffect(() => {
    logger.logTraceUseEffect('SINGLE-LAYER - scroll list item into view', layerIsSelected, layerId);

    if (layerIsSelected && layerId) {
      const listItem = document.getElementById(layerId);
      if (listItem) {
        scrollListItemIntoView(listItem);
      }
    }
  }, [layerIsSelected, layerId]);

  // Check if any descendant layer is selected — layer paths are hierarchical so startsWith works
  const layerChildIsSelected = displayState === 'view' && !!selectedLayerPath && selectedLayerPath.startsWith(`${layerPath}/`);

  // Check if any layer in the subtree has visibility disabled
  const isLayerAlwaysVisible = useStoreLayerHasDisabledVisibility(layerPath);

  // #region HANDLERS

  /**
   * Blur any focused button element that is not within this layer.
   * This ensures hasFocusWithin state is properly cleared on other layers.
   */
  const blurOtherLayerButtons = useCallback((): void => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.tagName === 'BUTTON' && !layerListItemRef.current?.contains(activeElement)) {
      activeElement.blur();
    }
  }, []);

  /**
   * Select the layer if not already selected and status is valid.
   *
   * @param openPanel - Whether to open the details panel (default: true)
   */
  const selectLayerIfNeeded = useCallback(
    (openPanel: boolean = true): void => {
      if (!layerIsSelected && ['processed', 'loaded'].includes(layerStatus!)) {
        layerController.setSelectedLayerPath(layerPath);
        if (openPanel) {
          showLayerDetailsPanel?.(layerId || '');
        }
      }
    },
    [layerController, layerIsSelected, layerStatus, layerPath, layerId, showLayerDetailsPanel]
  );

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = useCallback((): void => {
    // Blur focused buttons on other layers
    blurOtherLayerButtons();

    // Select the layer if not already selected
    selectLayerIfNeeded();

    // Set legend collapse value
    layerController.toggleLegendCollapsed(layerPath);
  }, [layerPath, selectLayerIfNeeded, layerController, blurOtherLayerButtons]);

  const handleExpandGroupKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        // Blur focused buttons on other layers
        blurOtherLayerButtons();

        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Set legend collapse value
        layerController.toggleLegendCollapsed(layerPath);

        // Allow the toggle expansion action to work
        event.preventDefault();
      }
    },
    [layerPath, layerController, blurOtherLayerButtons, selectLayerIfNeeded]
  );

  const handleLayerClick = useCallback((): void => {
    // Only clickable if the layer status is processed or loaded
    if (!['processed', 'loaded'].includes(layerStatus!)) {
      return;
    }

    // Blur focused buttons on other layers
    blurOtherLayerButtons();

    // Set selected layer path
    layerController.setSelectedLayerPath(layerPath);
    showLayerDetailsPanel?.(layerId || '');
  }, [layerController, layerPath, layerId, layerStatus, showLayerDetailsPanel, blurOtherLayerButtons]);

  const handleArrowClick = useCallback(
    (direction: number) => {
      // Select the layer if not already selected
      selectLayerIfNeeded();

      // Reorder
      layerController.reorderLayer(layerPath, direction);

      // Scroll into view after DOM updates (scrollListItemIntoView utility does not work well for this)
      requestAnimationFrame(() => {
        layerListItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    },
    [layerPath, selectLayerIfNeeded, layerController]
  );

  const handleArrowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, direction: number) => {
      if (event.key === 'Enter' || event.key === ' ') {
        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Reorder
        layerController.reorderLayer(layerPath, direction);

        // Allow the reorder action to work
        event.preventDefault();

        // Scroll into view after DOM updates (scrollListItemIntoView utility does not work well for this)
        requestAnimationFrame(() => {
          layerListItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        });
      }
    },
    [layerPath, selectLayerIfNeeded, layerController]
  );

  const handleArrowKeyDownWrapper = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Determine direction from button id
      const direction = event.currentTarget.id.includes('up-order') ? -1 : 1;

      // Determine if button is disabled based on position
      const isDisabled = direction === -1 ? isFirst : isLast;

      // Prevent activation if disabled (but allow navigation keys like Tab)
      if (isDisabled && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        return;
      }

      handleArrowKeyDown(event, direction);
    },
    [handleArrowKeyDown, isFirst, isLast]
  );

  const handleArrowClickWrapper = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // Determine direction from button id
      const direction = event.currentTarget.id.includes('up-order') ? -1 : 1;

      // Determine if button is disabled based on position
      const isDisabled = direction === -1 ? isFirst : isLast;

      // Prevent action if disabled
      if (isDisabled) {
        event.preventDefault();
        return;
      }

      handleArrowClick(direction);
    },
    [handleArrowClick, isFirst, isLast]
  );

  const handleToggleVisibility = useCallback((): void => {
    // Early return if button is disabled
    if (!inVisibleRange || parentHidden) {
      return;
    }
    // Select the layer if not already selected
    selectLayerIfNeeded();

    // Toggle visibility
    layerController.setOrToggleLayerVisibility(layerPath);
  }, [layerPath, layerController, selectLayerIfNeeded, inVisibleRange, parentHidden]);

  const handleToggleVisibilityKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      // Only handle Enter and Space keys
      if (event.key === 'Enter' || event.key === ' ') {
        // Prevent activation if disabled (but allow navigation keys like Tab)
        if (!inVisibleRange || parentHidden) {
          event.preventDefault();
          return;
        }

        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Toggle visibility
        layerController.setOrToggleLayerVisibility(layerPath);

        // Allow the toggle visibility action to work
        event.preventDefault();
      }
    },
    [layerPath, layerController, selectLayerIfNeeded, inVisibleRange, parentHidden]
  );

  const handleZoomToLayerVisibleScale = useCallback((): void => {
    // Return early if button is disabled
    if (!isZoomToVisibleScaleCapable) {
      return;
    }

    // Select the layer if not already selected
    selectLayerIfNeeded();

    // Zoom to visible scale
    layerController.zoomToLayerVisibleScale(layerPath);
  }, [layerPath, layerController, selectLayerIfNeeded, isZoomToVisibleScaleCapable]);

  const handleZoomToLayerVisibleScaleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        // Guard: prevent activation if disabled (but allow navigation keys like Tab)
        if (!isZoomToVisibleScaleCapable) {
          event.preventDefault();
          return;
        }

        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Zoom to visible scale
        layerController.zoomToLayerVisibleScale(layerPath);

        // Allow the zoom to visible scale action to work
        event.preventDefault();
      }
    },
    [layerPath, layerController, selectLayerIfNeeded, isZoomToVisibleScaleCapable]
  );

  const handleReload = useCallback((): void => {
    // Select the layer if not already selected
    selectLayerIfNeeded();

    // Reload layer
    layerCreatorController.reloadLayer(layerPath);
  }, [layerCreatorController, layerPath, selectLayerIfNeeded]);

  const handleReloadKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Set ref to indicate a reload has been requested so focus can be set to the reload button after status updates
        reloadRequestedRef.current = true;

        // Reload layer
        layerCreatorController.reloadLayer(layerPath);

        // Allow the reload action to work
        event.preventDefault();
      }
    },
    [layerCreatorController, layerPath, selectLayerIfNeeded]
  );

  // Handlers for keyboard navigation of the sorting arrows and action buttons for accessibility
  const handleFocusWithin = useCallback((): void => {
    setHasFocusWithin(true);
  }, []);

  const handleBlurWithin = useCallback((event: React.FocusEvent<HTMLElement>): void => {
    // Only blur if focus moved outside this layer item
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setHasFocusWithin(false);
    }
  }, []);

  // #endregion HANDLERS

  // Get layer description
  const memoLayerDescription = useMemo((): JSX.Element | string | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoLayerDescription', layerPath, layerStatus);

    if (layerStatus === 'error') {
      return t('legend.layerError');
    }

    if (layerStatus === 'registered') {
      return t('legend.layerRegister');
    }

    if (parentHidden) return t('layers.parentHidden');

    if (layerChildPaths && layerChildPaths.length > 0) {
      return t('legend.subLayersCount').replace('{count}', layerChildPaths.length.toString());
    }

    const count = layerItems?.filter((d) => d.isVisible !== false).length || 0;
    const totalCount = layerItems?.length || 0;

    let itemsLengthDesc = t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());

    if (totalCount <= 1) {
      itemsLengthDesc = '';
    }

    return itemsLengthDesc;
  }, [layerPath, layerStatus, parentHidden, t, layerChildPaths, layerItems]);

  // Memoize the EditModeButtons component section

  const memoEditModeButtons = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoEditModeButtons', layerPath);

    // Only show arrow buttons when this specific layer is selected
    // Do not show when only a child is selected
    if ((layerIsSelected || (hasFocusWithin && isKeyboardNavigationMode)) && displayState === 'view') {
      return (
        <>
          <IconButton
            className="buttonOutline"
            id={orderUpButtonId}
            edge="end"
            size="small"
            onKeyDown={handleArrowKeyDownWrapper}
            onClick={handleArrowClickWrapper}
            sx={isFirst ? memoSxClasses.orderButtonDisabled : memoSxClasses.orderButtonEnabled}
            aria-label={t('layers.moveLayerUp')}
            aria-disabled={isFirst} // WCAG - used instead of disabled to allow button retain focus and be discoverable by screen readers
          >
            <ArrowUpIcon />
          </IconButton>
          <IconButton
            className="buttonOutline"
            id={orderDownButtonId}
            edge="end"
            size="small"
            onKeyDown={handleArrowKeyDownWrapper}
            onClick={handleArrowClickWrapper}
            sx={isLast ? memoSxClasses.orderButtonDisabled : memoSxClasses.orderButtonEnabled}
            aria-label={t('layers.moveLayerDown')}
            aria-disabled={isLast} // WCAG - used instead of disabled to allow button retain focus and be discoverable by screen readers
          >
            <ArrowDownwardIcon />
          </IconButton>
          <Divider orientation="vertical" sx={memoSxClasses.dividerVertical} variant="middle" flexItem />
        </>
      );
    }
    return null;
  }, [
    layerIsSelected,
    displayState,
    handleArrowClickWrapper,
    handleArrowKeyDownWrapper,
    isFirst,
    isLast,
    layerPath,
    t,
    memoSxClasses.orderButtonDisabled,
    memoSxClasses.orderButtonEnabled,
    memoSxClasses.dividerVertical,
    hasFocusWithin,
    orderDownButtonId,
    orderUpButtonId,
    isKeyboardNavigationMode,
  ]);

  // Memoize the MoreLayerButtons component section
  const memoMoreLayerButtons = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoMoreLayerButtons', layerPath);

    if (showDeleteOnLoading && displayState === 'view') {
      // Show delete button after 5 seconds for loading layers
      if (showDeleteOnLoading) {
        return (
          <DeleteUndoButton
            layerPath={layerPath}
            layerRemovable={layerControls?.remove !== false}
            focusTargetIdAfterDelete={panelCloseButtonId}
          />
        );
      }
      return null;
    }
    if (displayState !== 'view') {
      return null;
    }
    if (layerStatus === 'error') {
      return (
        <>
          <IconButton
            id={reloadButtonId}
            edge="end"
            size="small"
            className="buttonOutline"
            onClick={handleReload}
            onKeyDown={handleReloadKeyDown}
            aria-label={layerChildPaths && layerChildPaths.length > 0 ? t('layers.reloadSublayers') : t('layers.reloadLayer')}
          >
            <LoopIcon />
          </IconButton>
          <DeleteUndoButton
            layerPath={layerPath}
            layerRemovable={layerControls?.remove !== false}
            focusTargetIdAfterDelete={panelCloseButtonId}
          />
        </>
      );
    }

    if (isLayerAlwaysVisible) {
      if (isLayerVisibleCapable) {
        return (
          <IconButton
            edge="end"
            size="small"
            className="buttonOutline"
            aria-disabled={!inVisibleRange} // WCAG - used instead of disabled to allow button to be discoverable by screen readers
            aria-label={t('layers.visibilityIsAlways')}
          >
            <VisibilityOutlinedIcon color="disabled" />
          </IconButton>
        );
      }
      return <Box />;
    }

    return (
      <>
        {isZoomToVisibleScaleButton && (
          <IconButton
            edge="end"
            size="small"
            sx={memoSxClasses.zoomButton}
            className="buttonOutline"
            onClick={handleZoomToLayerVisibleScale}
            onKeyDown={handleZoomToLayerVisibleScaleKeyDown}
            aria-label={t('layers.zoomVisibleScale')}
            aria-disabled={!isZoomToVisibleScaleCapable} // WCAG - used instead of disabled to allow button to be discoverable by screen readers
          >
            <CenterFocusScaleIcon />
          </IconButton>
        )}
        {isLayerVisibleCapable && (
          <IconButton
            edge={inVisibleRange ? false : 'end'}
            size="small"
            onClick={handleToggleVisibility}
            onKeyDown={handleToggleVisibilityKeyDown}
            className="buttonOutline"
            tooltip={t('layers.toggleVisibility')}
            aria-disabled={!inVisibleRange || parentHidden} // WCAG - used instead of disabled to allow button to be discoverable by screen readers
            aria-label={`${t('layers.toggleVisibility')} - ${layerName}`} // WCAG - Provide descriptive aria-label for screen readers
            aria-pressed={isVisible}
          >
            {isVisible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
          </IconButton>
        )}
      </>
    );
  }, [
    layerName,
    layerPath,
    layerStatus,
    displayState,
    showDeleteOnLoading,
    layerControls?.remove,
    isLayerAlwaysVisible,
    inVisibleRange,
    isZoomToVisibleScaleCapable,
    isZoomToVisibleScaleButton,
    t,
    handleZoomToLayerVisibleScale,
    handleZoomToLayerVisibleScaleKeyDown,
    isLayerVisibleCapable,
    handleToggleVisibility,
    handleToggleVisibilityKeyDown,
    isVisible,
    layerChildPaths,
    handleReload,
    handleReloadKeyDown,
    parentHidden,
    reloadButtonId,
    panelCloseButtonId,
    memoSxClasses.zoomButton,
  ]);

  // Memoize the arrow buttons component section
  const memoArrowButtons = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoArrowButtons');

    if (layerChildPaths?.length) {
      return (
        <IconButton
          color="primary"
          edge="end"
          size="small"
          onClick={handleExpandGroupClick}
          onKeyDown={handleExpandGroupKeyDown}
          aria-label={t('layers.toggleCollapse')}
          className="buttonOutline"
        >
          {legendExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      );
    }

    return null;
  }, [handleExpandGroupClick, handleExpandGroupKeyDown, layerChildPaths, legendExpanded, t]);

  // Memoize the collapse component section
  const memoCollapse = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoCollapse', layerChildPaths);

    if (!layerChildPaths?.length) {
      return null;
    }

    return (
      <Collapse in={legendExpanded} timeout="auto">
        <LayersList
          depth={1 + depth}
          layerPaths={layerChildPaths}
          isLayoutEnlarged={isLayoutEnlarged}
          showLayerDetailsPanel={showLayerDetailsPanel}
          containerType={containerType}
        />
      </Collapse>
    );
  }, [depth, isLayoutEnlarged, layerChildPaths, legendExpanded, showLayerDetailsPanel, containerType]);

  // Memoize the container class section
  const memoContainerClass = useMemo(() => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoContainerClass');

    const result: string[] = ['layer-panel ', layerStatus ?? ''];

    if (depth === 0) {
      result.push('bordered');
    }

    // if layer has selected child but its not itself selected
    if (layerChildIsSelected && !layerIsSelected && !legendExpanded) {
      result.push('selectedLayer bordered-primary');
    }

    if (layerIsSelected) {
      result.push('selectedLayer bordered-primary');
    }

    return result.join(' ');
  }, [depth, layerStatus, layerChildIsSelected, layerIsSelected, legendExpanded]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SINGLE-LAYER - layerIsSelected');

    // Scroll into view when layer is selected
    if (layerIsSelected) {
      layerListItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [layerIsSelected]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SINGLE-LAYER - restore focus after reload');

    if (reloadRequestedRef.current === true) {
      if (layerStatus === 'loaded') {
        // Successful reload - focus the main layer button
        requestAnimationFrame(() => {
          document.getElementById(layerListItemButtonId)?.focus();
          reloadRequestedRef.current = false;
        });
      } else if (layerStatus === 'error') {
        // Failed reload - focus the reload button for retry
        requestAnimationFrame(() => {
          document.getElementById(reloadButtonId)?.focus();
          reloadRequestedRef.current = false;
        });
      }
    }
  }, [layerStatus, layerPath, reloadButtonId, layerListItemButtonId]);

  /** Memoized sx for the list item button. */
  const memoListItemButtonSx = useMemo(() => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoListItemButtonSx', inVisibleRange, parentHidden, isVisible, layerStatus);

    return {
      minHeight: '4.51rem',
      ...(!inVisibleRange || parentHidden || !isVisible || layerStatus === 'error' ? memoSxClasses.outOfRange : {}),
    };
  }, [inVisibleRange, parentHidden, isVisible, layerStatus, memoSxClasses.outOfRange]);

  return (
    <ListItem
      ref={layerListItemRef}
      className={memoContainerClass}
      key={layerName}
      disablePadding={true}
      data-layer-depth={depth}
      onFocusCapture={handleFocusWithin}
      onBlurCapture={handleBlurWithin}
    >
      <Box sx={memoSxClasses.containerBox}>
        <Tooltip
          title={t('layers.selectLayer', { layerName })}
          placement="top"
          enterDelay={theme.transitions.duration.tooltipDelay}
          enterNextDelay={theme.transitions.duration.tooltipDelay}
          arrow
          slotProps={TOOLTIP_SLOT_PROPS}
        >
          <ListItemButton
            id={layerListItemButtonId}
            onClick={handleLayerClick}
            selected={layerIsSelected || (layerChildIsSelected && !legendExpanded)}
            sx={memoListItemButtonSx}
            className={!inVisibleRange ? 'out-of-range' : ''}
            aria-current={layerIsSelected ? true : undefined}
          >
            <LayerIcon layerPath={layerPath} />
            <ListItemText primary={layerName !== undefined ? layerName : layerId} secondary={memoLayerDescription} />
          </ListItemButton>
        </Tooltip>
        {!isLayoutEnlarged && (
          <Box className="rightIcons-container" role="group" aria-label={t('layers.layerControls')!}>
            {memoEditModeButtons}
            {memoMoreLayerButtons}
            {memoArrowButtons}
          </Box>
        )}
        {layerStatus === 'loading' && (
          <Box sx={memoSxClasses.progressBarSingleLayer}>
            <ProgressBar aria-label={t('layers.status.layerLoadingDescriptive', { layerName })!} />
          </Box>
        )}
      </Box>
      {memoCollapse}
    </ListItem>
  );
}
