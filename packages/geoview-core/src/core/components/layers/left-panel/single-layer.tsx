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
import type { TypeLegendLayer } from '@/core/components/layers/types';
import {
  useLayerStoreActions,
  useLayerDisplayState,
  useLayerSelectedLayerPath,
  useLayerSelectorName,
  useLayerSelectorId,
  useLayerSelectorStatus,
  useLayerSelectorEntryType,
  useLayerSelectorControls,
  useLayerSelectorChildren,
  useLayerSelectorItems,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useMapStoreActions,
  useMapSelectorLayerLegendCollapsed,
  useMapSelectorLayerVisibility,
  useMapSelectorLayerInVisibleRange,
  useMapSelectorLayerParentHidden,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { DeleteUndoButton } from '@/core/components/layers/right-panel/delete-undo-button';
import { LayersList } from './layers-list';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { logger } from '@/core/utils/logger';
import { useDataTableStoreActions } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { ArrowDownwardIcon, ArrowUpIcon, CenterFocusScaleIcon, LoopIcon } from '@/ui/icons';
import { Divider } from '@/ui/divider/divider';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import type { TypeLayerControls } from '@/api/types/layer-schema-types';
import { scrollListItemIntoView } from '@/core/utils/utilities';
import { TIMEOUT, TABS } from '@/core/utils/constant';
import type { TypeContainerBox } from '@/core/types/global-types';
import { useUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';

interface SingleLayerProps {
  layerPath: string;
  depth: number;
  showLayerDetailsPanel: (layerId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isLayoutEnlarged: boolean;
  containerType: TypeContainerBox;
}

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
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Create ref for scrolling into view
  const layerListItemRef = useRef<HTMLLIElement>(null);

  // Ref to track if a reload has been requested
  const reloadRequestedRef = useRef<boolean>(false);

  // Get store states
  const { deleteLayer, reloadLayer, setSelectedLayerPath, zoomToLayerVisibleScale, getLayerDeleteInProgress } = useLayerStoreActions();
  const { setOrToggleLayerVisibility, toggleLegendCollapsed, reorderLayer } = useMapStoreActions();
  const mapId = useGeoViewMapId();
  const selectedLayerPath = useLayerSelectedLayerPath();
  const displayState = useLayerDisplayState();
  const layerIsSelected = layerPath === selectedLayerPath && displayState === 'view';
  const isKeyboardNavigationMode = useUIActiveTrapGeoView();

  useDataTableStoreActions();

  const isVisible = useMapSelectorLayerVisibility(layerPath);
  const inVisibleRange = useMapSelectorLayerInVisibleRange(layerPath);
  const legendExpanded = !useMapSelectorLayerLegendCollapsed(layerPath);
  const parentHidden = useMapSelectorLayerParentHidden(layerPath);

  const layerId = useLayerSelectorId(layerPath);
  const layerName = useLayerSelectorName(layerPath);
  const layerStatus = useLayerSelectorStatus(layerPath);
  const layerEntryType = useLayerSelectorEntryType(layerPath);
  const layerControls = useLayerSelectorControls(layerPath);
  const layerChildren = useLayerSelectorChildren(layerPath);
  const layerItems = useLayerSelectorItems(layerPath);

  // Build unique ID format
  const panelCloseButtonId = `${mapId}-${containerType}-${TABS.LAYERS}-panel-close-btn`;
  const layerListItemButtonId = `${mapId}-${containerType}-${TABS.LAYERS}-${layerPath}`;
  const reloadButtonId = `${mapId}-${containerType}-${layerPath}-reload-btn`;
  const orderUpButtonId = `${mapId}-${containerType}-${layerPath}-up-order-btn`;
  const orderDownButtonId = `${mapId}-${containerType}-${layerPath}-down-order-btn`;

  // State to track if delete button should show for loading layers
  const [showDeleteOnLoading, setShowDeleteOnLoading] = useState(false);

  // State to track if the layer item has focus within for accessibility purposes
  const [hasFocusWithin, setHasFocusWithin] = useState(false);

  // Is visibility button disabled?
  const isLayerVisibleCapable = layerControls?.visibility;

  // Timer to show delete button after a delay for loading/processing layers so user can remove them to enable collapse/show all
  useEffect(() => {
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
    if (layerIsSelected && layerId) {
      const listItem = document.getElementById(layerId);
      if (listItem) {
        scrollListItemIntoView(listItem);
      }
    }
  }, [layerIsSelected, layerId]);

  // if any of the child layers is selected return true
  const isLayerChildSelected = useCallback(
    (children: TypeLegendLayer[] | undefined): boolean => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - isLayerChildSelected');

      if (displayState !== 'view') {
        return false;
      }
      if (children && children.length > 0) {
        if (children.filter((child) => child.layerPath === selectedLayerPath).length > 0) {
          return true;
        }

        return children.some((child) => isLayerChildSelected(child.children));
      }
      return false;
    },
    [displayState, selectedLayerPath]
  );

  const layerChildIsSelected = isLayerChildSelected(layerChildren);

  // returns true if any of the layer children has visibility of false
  const layerHasDisabledVisibility = useCallback(
    (children: TypeLegendLayer[] | undefined, controls: TypeLayerControls | undefined): boolean => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - layerHasDisabledVisibility');

      if (controls?.visibility === false) {
        return true;
      }
      let childrenHasAlways = false;
      if (children && children.length > 0) {
        childrenHasAlways = children.some((child) => layerHasDisabledVisibility(child.children, child.controls));
      }

      return childrenHasAlways;
    },
    []
  );

  const isLayerAlwaysVisible = layerHasDisabledVisibility(layerChildren, layerControls);

  // #region HANDLERS

  /**
   * Blur any focused button element that is not within this layer.
   * This ensures hasFocusWithin state is properly cleared on other layers.
   */
  const blurOtherLayerButtons = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - blurOtherLayerButtons');

    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.tagName === 'BUTTON' && !layerListItemRef.current?.contains(activeElement)) {
      activeElement.blur();
    }
  }, []);

  /**
   * Select the layer if not already selected and status is valid.
   * @param {boolean} openPanel - Whether to open the details panel (default: true)
   */
  const selectLayerIfNeeded = useCallback(
    (openPanel: boolean = true): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - selectLayerIfNeeded');

      if (!layerIsSelected && ['processed', 'loaded'].includes(layerStatus!)) {
        setSelectedLayerPath(layerPath);
        if (openPanel) {
          showLayerDetailsPanel?.(layerId || '');
        }
      }
    },
    [layerIsSelected, layerStatus, layerPath, layerId, setSelectedLayerPath, showLayerDetailsPanel]
  );

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleExpandGroupClick');

    // Blur focused buttons on other layers
    blurOtherLayerButtons();

    // Select the layer if not already selected
    selectLayerIfNeeded();

    // Set legend collapse value
    toggleLegendCollapsed(layerPath);
  }, [layerPath, selectLayerIfNeeded, toggleLegendCollapsed, blurOtherLayerButtons]);

  const handleExpandGroupKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleExpandGroupKeyDown');

      if (event.key === 'Enter' || event.key === ' ') {
        // Blur focused buttons on other layers
        blurOtherLayerButtons();

        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Set legend collapse value
        toggleLegendCollapsed(layerPath);

        // Allow the toggle expansion action to work
        event.preventDefault();
      }
    },
    [layerPath, toggleLegendCollapsed, blurOtherLayerButtons, selectLayerIfNeeded]
  );

  const handleLayerClick = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleLayerClick');

    // Check if there's a delete in progress on another layer
    const layerDeleteInProgress = getLayerDeleteInProgress();
    if (layerDeleteInProgress && layerDeleteInProgress !== layerPath) {
      // Complete the delete for the other layer
      deleteLayer(layerDeleteInProgress);
    }

    // Only clickable if the layer status is processed or loaded
    if (!['processed', 'loaded'].includes(layerStatus!)) {
      return;
    }

    // Blur focused buttons on other layers
    blurOtherLayerButtons();

    // Set selected layer path
    setSelectedLayerPath(layerPath);
    showLayerDetailsPanel?.(layerId || '');
  }, [
    layerPath,
    layerId,
    layerStatus,
    setSelectedLayerPath,
    showLayerDetailsPanel,
    getLayerDeleteInProgress,
    deleteLayer,
    blurOtherLayerButtons,
  ]);

  const handleArrowClick = useCallback(
    (direction: number) => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleArrowClick');

      // Select the layer if not already selected
      selectLayerIfNeeded();

      reorderLayer(layerPath, direction);

      // Scroll into view after DOM updates (scrollListItemIntoView utility does not work well for this)
      requestAnimationFrame(() => {
        layerListItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    },
    [layerPath, selectLayerIfNeeded, reorderLayer]
  );

  const handleArrowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, direction: number) => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleArrowKeyDown');

      if (event.key === 'Enter' || event.key === ' ') {
        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        reorderLayer(layerPath, direction);

        // Allow the reorder action to work
        event.preventDefault();

        // Scroll into view after DOM updates (scrollListItemIntoView utility does not work well for this)
        requestAnimationFrame(() => {
          layerListItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        });
      }
    },
    [layerPath, selectLayerIfNeeded, reorderLayer]
  );

  const handleArrowKeyDownWrapper = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleArrowKeyDownWrapper');

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
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleArrowClickWrapper');

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
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleToggleVisibility');

    // Select the layer if not already selected
    selectLayerIfNeeded();

    // Toggle visibility
    setOrToggleLayerVisibility(layerPath);
  }, [layerPath, selectLayerIfNeeded, setOrToggleLayerVisibility]);

  const handleToggleVisibilityKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleToggleVisibilityKeyDown');

      // Only handle Enter and Space keys
      if (event.key === 'Enter' || event.key === ' ') {
        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Toggle visibility
        setOrToggleLayerVisibility(layerPath);

        // Allow the toggle visibility action to work
        event.preventDefault();
      }
    },
    [layerPath, selectLayerIfNeeded, setOrToggleLayerVisibility]
  );

  const handleZoomToLayerVisibleScale = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleZoomToLayerVisibleScale');

    // Select the layer if not already selected
    selectLayerIfNeeded();

    // Zoom to visible scale
    zoomToLayerVisibleScale(layerPath);
  }, [layerPath, selectLayerIfNeeded, zoomToLayerVisibleScale]);

  const handleZoomToLayerVisibleScaleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleZoomToLayerVisibleScaleKeyDown');

      if (event.key === 'Enter' || event.key === ' ') {
        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Zoom to visible scale
        zoomToLayerVisibleScale(layerPath);

        // Allow the zoom to visible scale action to work
        event.preventDefault();

        // Restore focus to main layer button after zoom completes
        requestAnimationFrame(() => {
          document.getElementById(layerListItemButtonId)?.focus();
        });
      }
    },
    [layerPath, zoomToLayerVisibleScale, selectLayerIfNeeded, layerListItemButtonId]
  );

  const handleReload = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleReload');

    // Select the layer if not already selected
    selectLayerIfNeeded();

    // Reload layer
    reloadLayer(layerPath);
  }, [layerPath, selectLayerIfNeeded, reloadLayer]);

  const handleReloadKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleReloadKeyDown');

      if (event.key === 'Enter' || event.key === ' ') {
        // Select the layer if not already selected
        selectLayerIfNeeded(false);

        // Set ref to indicate a reload has been requested so focus can be set to the reload button after status updates
        reloadRequestedRef.current = true;

        // Reload layer
        reloadLayer(layerPath);

        // Allow the reload action to work
        event.preventDefault();
      }
    },
    [layerPath, reloadLayer, selectLayerIfNeeded]
  );

  // Handlers for keyboard navigation of the sorting arrows and action buttons for accessibility
  const handleFocusWithin = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleFocusWithin');

    setHasFocusWithin(true);
  }, []);

  const handleBlurWithin = useCallback((event: React.FocusEvent<HTMLElement>): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleBlurWithin');

    // Only blur if focus moved outside this layer item
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
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

    if (layerChildren && layerChildren.length > 0) {
      return t('legend.subLayersCount').replace('{count}', layerChildren.length.toString());
    }

    const count = layerItems?.filter((d) => d.isVisible !== false).length || 0;
    const totalCount = layerItems?.length || 0;

    let itemsLengthDesc = t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());

    if (totalCount <= 1) {
      itemsLengthDesc = '';
    }

    return itemsLengthDesc;
  }, [layerPath, layerStatus, parentHidden, t, layerChildren, layerItems]);

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
            aria-label={t('layers.moveLayerUp')}
            aria-disabled={isFirst}
            edge="end"
            size="small"
            onKeyDown={handleArrowKeyDownWrapper}
            onClick={handleArrowClickWrapper}
            sx={isFirst ? sxClasses.orderButtonDisabled : sxClasses.orderButtonEnabled}
          >
            <ArrowUpIcon />
          </IconButton>
          <IconButton
            className="buttonOutline"
            id={orderDownButtonId}
            aria-label={t('layers.moveLayerDown')}
            aria-disabled={isLast}
            edge="end"
            size="small"
            onKeyDown={handleArrowKeyDownWrapper}
            onClick={handleArrowClickWrapper}
            sx={isLast ? sxClasses.orderButtonDisabled : sxClasses.orderButtonEnabled}
          >
            <ArrowDownwardIcon />
          </IconButton>
          <Divider orientation="vertical" sx={sxClasses.dividerVertical} variant="middle" flexItem />
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
    sxClasses.orderButtonDisabled,
    sxClasses.orderButtonEnabled,
    sxClasses.dividerVertical,
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
            aria-label={layerChildren && layerChildren.length > 0 ? t('layers.reloadSublayers') : t('layers.reloadLayer')}
            className="buttonOutline"
            onClick={handleReload}
            onKeyDown={handleReloadKeyDown}
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
            aria-label={t('layers.visibilityIsAlways')}
            className="buttonOutline"
            disabled={!inVisibleRange}
          >
            <VisibilityOutlinedIcon color="disabled" />
          </IconButton>
        );
      }
      return <Box />;
    }

    // Is zoom to visible scale button visible?
    const isZoomToVisibleScaleCapable = !inVisibleRange && layerEntryType !== 'group';

    return (
      <>
        <IconButton
          edge="end"
          size="small"
          aria-label={t('layers.zoomVisibleScale')}
          sx={{ ...sxClasses.zoomButton, display: isZoomToVisibleScaleCapable ? 'block' : 'none' }}
          className="buttonOutline"
          onClick={handleZoomToLayerVisibleScale}
          onKeyDown={handleZoomToLayerVisibleScaleKeyDown}
        >
          <CenterFocusScaleIcon />
        </IconButton>
        {isLayerVisibleCapable && (
          <IconButton
            edge={inVisibleRange ? false : 'end'}
            size="small"
            onClick={handleToggleVisibility}
            onKeyDown={handleToggleVisibilityKeyDown}
            aria-label={t('layers.toggleVisibility')}
            className="buttonOutline"
            disabled={!inVisibleRange || parentHidden}
          >
            {isVisible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
          </IconButton>
        )}
      </>
    );
  }, [
    layerPath,
    layerStatus,
    displayState,
    showDeleteOnLoading,
    layerControls?.remove,
    isLayerAlwaysVisible,
    layerEntryType,
    inVisibleRange,
    t,
    handleZoomToLayerVisibleScale,
    handleZoomToLayerVisibleScaleKeyDown,
    isLayerVisibleCapable,
    handleToggleVisibility,
    handleToggleVisibilityKeyDown,
    isVisible,
    layerChildren,
    handleReload,
    handleReloadKeyDown,
    parentHidden,
    reloadButtonId,
    panelCloseButtonId,
    sxClasses.zoomButton,
  ]);

  // Memoize the arrow buttons component section
  const memoArrowButtons = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoArrowButtons');

    if (layerChildren?.length) {
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
  }, [handleExpandGroupClick, handleExpandGroupKeyDown, layerChildren, legendExpanded, t]);

  // Memoize the collapse component section
  const memoCollapse = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoCollapse', layerChildren);

    if (!(layerChildren && layerChildren.length)) {
      return null;
    }

    return (
      <Collapse in={legendExpanded} timeout="auto">
        <LayersList
          depth={1 + depth}
          layersList={layerChildren}
          isLayoutEnlarged={isLayoutEnlarged}
          showLayerDetailsPanel={showLayerDetailsPanel}
          containerType={containerType}
        />
      </Collapse>
    );
  }, [depth, isLayoutEnlarged, layerChildren, legendExpanded, showLayerDetailsPanel, containerType]);

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
      <Box sx={sxClasses.containerBox}>
        <Tooltip
          title={t('layers.selectLayer', { layerName })}
          placement="top"
          enterDelay={theme.transitions.duration.tooltipDelay}
          enterNextDelay={theme.transitions.duration.tooltipDelay}
          arrow
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
            id={layerListItemButtonId}
            onClick={handleLayerClick}
            selected={layerIsSelected || (layerChildIsSelected && !legendExpanded)}
            sx={{
              minHeight: '4.51rem',
              ...(!inVisibleRange || parentHidden || !isVisible || layerStatus === 'error' ? sxClasses.outOfRange : {}),
            }}
            className={!inVisibleRange ? 'out-of-range' : ''}
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
          <Box sx={sxClasses.progressBarSingleLayer}>
            <ProgressBar />
          </Box>
        )}
      </Box>
      {memoCollapse}
    </ListItem>
  );
}
