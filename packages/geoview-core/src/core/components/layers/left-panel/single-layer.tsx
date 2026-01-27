import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  useLayerSelectedLayerSortingArrowId,
  useLayerSelectorName,
  useLayerSelectorId,
  useLayerSelectorStatus,
  useLayerSelectorType,
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

// TODO: WCAG Issue #3108 - Check all disabled buttons. They may need special treatment. Need to find instance in UI first)
// TODO: WCAG Issue #3108 - Check all icon buttons for "state related" aria values (i.e aria-checked, aria-disabled, etc.)

interface SingleLayerProps {
  layerPath: string;
  depth: number;
  showLayerDetailsPanel: (layerId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isLayoutEnlarged: boolean;
}

export function SingleLayer({ depth, layerPath, showLayerDetailsPanel, isFirst, isLast, isLayoutEnlarged }: SingleLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/single-layer', layerPath);

  // Hook
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Create ref for scrolling into view
  const layerItemRef = useRef<HTMLLIElement>(null);

  // Get store states
  const { reloadLayer, setSelectedLayerPath, setSelectedLayerSortingArrowId, zoomToLayerVisibleScale } = useLayerStoreActions();
  const { setOrToggleLayerVisibility, toggleLegendCollapsed, reorderLayer } = useMapStoreActions();
  const mapId = useGeoViewMapId();
  const selectedLayerPath = useLayerSelectedLayerPath();
  const displayState = useLayerDisplayState();
  const layerIsSelected = layerPath === selectedLayerPath && displayState === 'view';
  const selectedLayerSortingArrowId = useLayerSelectedLayerSortingArrowId();

  useDataTableStoreActions();

  const isVisible = useMapSelectorLayerVisibility(layerPath);
  const inVisibleRange = useMapSelectorLayerInVisibleRange(layerPath);
  const legendExpanded = !useMapSelectorLayerLegendCollapsed(layerPath);
  const parentHidden = useMapSelectorLayerParentHidden(layerPath);

  const layerId = useLayerSelectorId(layerPath);
  const layerName = useLayerSelectorName(layerPath);
  const layerStatus = useLayerSelectorStatus(layerPath);
  const layerType = useLayerSelectorType(layerPath);
  const layerControls = useLayerSelectorControls(layerPath);
  const layerChildren = useLayerSelectorChildren(layerPath);
  const layerItems = useLayerSelectorItems(layerPath);

  // Is visibility button disabled?
  const isLayerVisibleCapable = layerControls?.visibility;

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
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleExpandGroupClick');

      // Prevent triggering parent onClick
      event.stopPropagation();

      // Set legend collapse value
      toggleLegendCollapsed(layerPath);
    },
    [layerPath, toggleLegendCollapsed]
  );

  const handleLayerClick = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleLayerClick');

    // Only clickable if the layer status is processed or loaded
    if (!['processed', 'loaded'].includes(layerStatus!)) {
      return;
    }

    // Set selected layer path
    setSelectedLayerPath(layerPath);
    showLayerDetailsPanel?.(layerId || '');
  }, [layerPath, layerId, layerStatus, setSelectedLayerPath, showLayerDetailsPanel]);

  const handleArrowClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, direction: number) => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleArrowClick');

      // Prevent triggering parent onClick
      event.stopPropagation();

      const arrowId = direction === -1 ? 'up-order' : 'down-order';
      setSelectedLayerSortingArrowId(`${mapId}-${layerPath}-${arrowId}`);
      reorderLayer(layerPath, direction);
    },
    [layerPath, mapId, reorderLayer, setSelectedLayerSortingArrowId]
  );

  const handleArrowKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, direction: number) => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleArrowKeyDown');

      if (event.key === 'Enter') {
        const arrowId = direction === -1 ? 'up-order' : 'down-order';
        setSelectedLayerSortingArrowId(`${mapId}-${layerPath}-${arrowId}`);
        reorderLayer(layerPath, direction);
        event.preventDefault();
      }
    },
    [layerPath, mapId, reorderLayer, setSelectedLayerSortingArrowId]
  );

  const handleArrowKeyDownWrapper = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Determine direction from button id
      const direction = event.currentTarget.id.includes('up-order') ? -1 : 1;
      handleArrowKeyDown(event, direction);
    },
    [handleArrowKeyDown]
  );

  const handleArrowClickWrapper = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // Determine direction from button id
      const direction = event.currentTarget.id.includes('up-order') ? -1 : 1;
      handleArrowClick(event, direction);
    },
    [handleArrowClick]
  );

  const handleToggleVisibility = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleToggleVisibility');

      // Prevent triggering parent onClick
      event.stopPropagation();

      // Toggle visibility
      setOrToggleLayerVisibility(layerPath);
    },
    [layerPath, setOrToggleLayerVisibility]
  );

  const handleZoomToLayerVisibleScale = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleZoomToLayerVisibleScale');

      // Prevent triggering parent onClick
      event.stopPropagation();

      // Zoom to visible scale
      zoomToLayerVisibleScale(layerPath);
    },
    [layerPath, zoomToLayerVisibleScale]
  );

  const handleReload = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleReload');

      // Prevent triggering parent onClick
      event.stopPropagation();

      // Reload layer
      reloadLayer(layerPath);
    },
    [layerPath, reloadLayer]
  );

  // #endregion HANDLERS

  // Get layer description
  const memoLayerDescription = useMemo((): JSX.Element | string | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoLayerDescription', layerPath, layerStatus);

    if (layerStatus === 'error') {
      return t('legend.layerError');
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

    if (layerIsSelected && displayState === 'view') {
      return (
        <>
          <IconButton
            id={`${mapId}-${layerPath}-up-order`}
            aria-label={t('layers.moveLayerUp')}
            disabled={isFirst}
            edge="end"
            size="small"
            onKeyDown={handleArrowKeyDownWrapper}
            onClick={handleArrowClickWrapper}
          >
            <ArrowUpIcon />
          </IconButton>
          <IconButton
            id={`${mapId}-${layerPath}-down-order`}
            aria-label={t('layers.moveLayerDown')}
            disabled={isLast}
            edge="end"
            size="small"
            onKeyDown={handleArrowKeyDownWrapper}
            onClick={handleArrowClickWrapper}
          >
            <ArrowDownwardIcon />
          </IconButton>
          <Divider
            orientation="vertical"
            sx={{
              marginLeft: '0.4rem',
              height: '1.5rem',
              backgroundColor: theme.palette.geoViewColor.bgColor.dark[300],
            }}
            variant="middle"
            flexItem
          />
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
    mapId,
    t,
    theme.palette.geoViewColor.bgColor.dark,
  ]);

  // Memoize the MoreLayerButtons component section
  const memoMoreLayerButtons = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoMoreLayerButtons', layerPath);

    if (layerStatus === 'processing' || layerStatus === 'loading' || displayState !== 'view') {
      return null;
    }
    if (layerStatus === 'error') {
      return (
        <>
          <IconButton
            edge="end"
            size="small"
            aria-label={layerChildren && layerChildren.length > 0 ? t('layers.reloadSublayers') : t('layers.reloadLayer')}
            className="buttonOutline"
            onClick={handleReload}
          >
            <LoopIcon />
          </IconButton>
          <DeleteUndoButton layerPath={layerPath} layerId={layerId!} layerRemovable={layerControls?.remove !== false} />
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
    const isZoomToVisibleScaleCapable = !!((layerType as string) !== 'group' && !inVisibleRange);

    return (
      <Box>
        <IconButton
          edge="end"
          size="small"
          aria-label={t('layers.zoomVisibleScale')}
          sx={{ display: isZoomToVisibleScaleCapable ? 'block' : 'none' }}
          onClick={handleZoomToLayerVisibleScale}
        >
          <CenterFocusScaleIcon />
        </IconButton>
        {isLayerVisibleCapable && (
          <IconButton
            edge={inVisibleRange ? false : 'end'}
            size="small"
            onClick={handleToggleVisibility}
            aria-label={t('layers.toggleVisibility')}
            className="buttonOutline"
            disabled={!inVisibleRange || parentHidden}
          >
            {isVisible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
          </IconButton>
        )}
      </Box>
    );
  }, [
    layerPath,
    layerStatus,
    displayState,
    isLayerAlwaysVisible,
    layerType,
    inVisibleRange,
    t,
    handleZoomToLayerVisibleScale,
    isLayerVisibleCapable,
    handleToggleVisibility,
    isVisible,
    layerChildren,
    handleReload,
    layerId,
    layerControls?.remove,
    parentHidden,
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
          aria-label={t('layers.toggleCollapse')}
          className="buttonOutline"
        >
          {legendExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      );
    }

    return null;
  }, [handleExpandGroupClick, layerChildren, legendExpanded, t]);

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
        />
      </Collapse>
    );
  }, [depth, isLayoutEnlarged, layerChildren, legendExpanded, showLayerDetailsPanel]);

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
    logger.logTraceUseEffect('SINGLE-LAYER - selectedLayerSortingArrowId');

    // Manually set the focus after sorting is done.
    if (selectedLayerSortingArrowId.length) {
      const elem = document.getElementById(selectedLayerSortingArrowId) as HTMLButtonElement;
      if (elem?.disabled) {
        if (selectedLayerSortingArrowId.split('-').includes('up')) {
          (elem?.nextSibling as HTMLButtonElement)?.focus();
        } else {
          (elem?.previousSibling as HTMLButtonElement)?.focus();
        }
      } else {
        elem?.focus();
      }
    }
  }, [selectedLayerSortingArrowId]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SINGLE-LAYER - layerIsSelected');

    // Scroll into view when layer is selected
    if (layerIsSelected) {
      layerItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [layerIsSelected]);

  return (
    <ListItem ref={layerItemRef} className={memoContainerClass} id={layerId} key={layerName} disablePadding={true} data-layer-depth={depth}>
      <Box>
        <Tooltip
          title={t('layers.selectLayer', { layerName })}
          placement="top"
          enterDelay={theme.transitions.duration.tooltipDelay}
          enterNextDelay={theme.transitions.duration.tooltipDelay}
          arrow
        >
          <ListItemButton
            onClick={handleLayerClick}
            selected={layerIsSelected || (layerChildIsSelected && !legendExpanded)}
            sx={{
              minHeight: '4.51rem',
              ...((!inVisibleRange || parentHidden || !isVisible || layerStatus === 'error') && sxClasses.outOfRange),
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
