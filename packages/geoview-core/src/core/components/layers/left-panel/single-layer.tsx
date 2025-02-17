import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { animated, useSpring } from '@react-spring/web';
import { Theme } from '@mui/material/styles';
import {
  Collapse,
  IconButton,
  KeyboardArrowDownIcon,
  KeyboardArrowUpIcon,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  VisibilityOffOutlinedIcon,
  VisibilityOutlinedIcon,
  Paper,
  Typography,
} from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import {
  useLayerStoreActions,
  useLayerDisplayState,
  useLayerSelectedLayerPath,
  useSelectedLayerSortingArrowId,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useMapStoreActions,
  useSelectorLayerLegendCollapsed,
  useSelectorLayerVisibility,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { DeleteUndoButton } from './delete-undo-button';
import { LayersList } from './layers-list';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { logger } from '@/core/utils/logger';
import { useDataTableLayerSettings, useDataTableStoreActions } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { ArrowDownwardIcon, ArrowUpIcon, TableViewIcon } from '@/ui/icons';
import { Divider } from '@/ui/divider/divider';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { useUISelectedFooterLayerListItemId } from '@/core/stores/store-interface-and-intial-values/ui-state';

interface SingleLayerProps {
  layer: TypeLegendLayer;
  depth: number;
  showLayerDetailsPanel: (layerId: string) => void;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isLayoutEnlarged: boolean;
}

export function SingleLayer({
  depth,
  layer,
  showLayerDetailsPanel,
  index,
  isFirst,
  isLast,
  isLayoutEnlarged,
}: SingleLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/single-layer', layer.layerPath);

  const { t } = useTranslation<string>();

  // Get store states
  const { setSelectedLayerPath, setSelectedLayerSortingArrowId } = useLayerStoreActions();
  const { setOrToggleLayerVisibility, setLegendCollapsed, reorderLayer } = useMapStoreActions();

  const mapId = useGeoViewMapId();
  const selectedLayerPath = useLayerSelectedLayerPath();
  const displayState = useLayerDisplayState();
  const datatableSettings = useDataTableLayerSettings();
  const selectedLayerSortingArrowId = useSelectedLayerSortingArrowId();
  const selectedFooterLayerListItemId = useUISelectedFooterLayerListItemId();

  useDataTableStoreActions();

  const isVisible = useSelectorLayerVisibility(layer.layerPath);
  const legendExpanded = !useSelectorLayerLegendCollapsed(layer.layerPath);

  // TODO: I think we should favor using this pattern here, with the store, instead of working with the whole 'layer' object from the props
  // const layerLegendQueryStatus: string | undefined = useSelectorLayerLegendQueryStatus(layer.layerPath);
  // const layerStatus: TypeLayerStatus | undefined = useSelectorLayerStatus(layer.layerPath);
  // const layerName: string | undefined = useSelectorLayerName(layer.layerPath);
  // const layerControls: TypeLayerControls | undefined = useSelectorLayerControls(layer.layerPath);
  // const layerChildren: TypeLegendLayer[] | undefined = useSelectorLayerChildren(layer.layerPath);
  // const layerItems: TypeLegendItem[] | undefined = useSelectorLayerItems(layer.layerPath);

  const listItemSpring = useSpring({
    delay: index * 150 + (depth * 150) / 2,
    from: { opacity: 0.1 },
    to: { opacity: 1 },
  });

  // if any of the child layers is selected return true
  const isLayerChildSelected = useCallback(
    (startingLayer: TypeLegendLayer): boolean => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - isLayerChildSelected');

      if (displayState !== 'view') {
        return false;
      }
      if (startingLayer.children && startingLayer.children.length > 0) {
        if (startingLayer.children.filter((child) => child.layerPath === selectedLayerPath).length > 0) {
          return true;
        }

        return _.some(startingLayer.children, (child) => isLayerChildSelected(child));
      }
      return false;
    },
    [displayState, selectedLayerPath]
  );

  const layerChildIsSelected = isLayerChildSelected(layer);
  const layerIsSelected = layer.layerPath === selectedLayerPath && displayState === 'view';

  // returns true if any of the layer children has visibility of false
  const layerHasDisabledVisibility = useCallback((startingLayer: TypeLegendLayer): boolean => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - layerHasDisabledVisibility');

    if (startingLayer.controls?.visibility === false) {
      return true;
    }
    let childrenHasAlways = false;
    if (startingLayer.children && startingLayer.children.length > 0) {
      childrenHasAlways = startingLayer.children.some((child) => layerHasDisabledVisibility(child));
    }

    return childrenHasAlways;
  }, []);

  const isLayerAlwaysVisible = layerHasDisabledVisibility(layer);

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleExpandGroupClick');

    // Set legend collapse value
    setLegendCollapsed(layer.layerPath);
  }, [layer.layerPath, setLegendCollapsed]);

  const handleLayerClick = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleLayerClick');

    // Only clickable if the layer status is processed or loaded
    if (!['processed', 'loaded'].includes(layer.layerStatus!)) {
      return;
    }

    // Set selected layer path
    setSelectedLayerPath(layer.layerPath);
    showLayerDetailsPanel?.(layer.layerId);
  }, [layer.layerPath, layer.layerId, layer.layerStatus, setSelectedLayerPath, showLayerDetailsPanel]);

  const handleListItemKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLLIElement>) => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleListItemKeyDown');

      // If clicked enter key
      if (event.key === 'Enter' && event.currentTarget === event.target) {
        // Redirect
        handleLayerClick();
      }
    },
    [handleLayerClick]
  );

  const handleIconButtonUpKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleIconButtonUpKeyDown');

      if (event.key === 'Enter') {
        setSelectedLayerSortingArrowId(`${mapId}-${layer.layerPath}-up-order`);
        reorderLayer(layer.layerPath, -1);
        event.preventDefault();
      }
    },
    [layer.layerPath, mapId, reorderLayer, setSelectedLayerSortingArrowId]
  );

  const handleIconButtonDownKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Log
      logger.logTraceUseCallback('SINGLE-LAYER - handleIconButtonDownKeyDown');

      if (event.key === 'Enter') {
        setSelectedLayerSortingArrowId(`${mapId}-${layer.layerPath}-down-order`);
        reorderLayer(layer.layerPath, 1);
        event.preventDefault();
      }
    },
    [layer.layerPath, mapId, reorderLayer, setSelectedLayerSortingArrowId]
  );

  const handleToggleVisibility = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('SINGLE-LAYER - handleToggleVisibility');

    // Toggle visibility
    setOrToggleLayerVisibility(layer.layerPath);
  }, [layer.layerPath, setOrToggleLayerVisibility]);

  // Get layer description
  const memoLayerDescription = useMemo((): JSX.Element | string | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoLayerDescription', layer.layerPath, layer.layerStatus);

    if (layer.layerStatus === 'error') {
      return t('legend.layerError');
    }
    if (layer.layerStatus === 'processing' || layer.layerStatus === 'loading') {
      return t('legend.layerLoading');
    }

    if (layer.children.length > 0) {
      return t('legend.subLayersCount').replace('{count}', layer.children.length.toString());
    }

    const count = layer.items.filter((d) => d.isVisible !== false).length;
    const totalCount = layer.items.length;

    let itemsLengthDesc = t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());

    if (totalCount <= 1) {
      itemsLengthDesc = '';
    }

    if (datatableSettings[layer.layerPath]) {
      return (
        <Typography sx={{ color: 'unset', fontSize: 'unset' }} component="span">
          {itemsLengthDesc} &nbsp;
          <TableViewIcon sx={{ marginBottom: '-5px' }} fontSize="small" />
        </Typography>
      );
    }
    return itemsLengthDesc;
  }, [datatableSettings, layer.children.length, layer.items, layer.layerPath, layer.layerStatus, t]);

  // Memoize the EditModeButtons component section
  const memoEditModeButtons = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoEditModeButtons', layer.layerPath);

    if (displayState === 'remove') {
      return <DeleteUndoButton layerPath={layer.layerPath} layerId={layer.layerId} layerRemovable={layer.controls?.remove !== false} />;
    }
    if (displayState === 'order') {
      return (
        <>
          {layer.children?.length > 0 && (
            <Divider
              orientation="vertical"
              sx={{
                marginLeft: '0.4rem',
                height: '1.5rem',
                backgroundColor: (theme: Theme) => theme.palette.geoViewColor.bgColor.dark[300],
              }}
              variant="middle"
              flexItem
            />
          )}
          <IconButton
            id={`${mapId}-${layer.layerPath}-up-order`}
            disabled={isFirst}
            edge="end"
            size="small"
            onKeyDown={handleIconButtonUpKeyDown}
            onClick={() => reorderLayer(layer.layerPath, -1)}
          >
            <ArrowUpIcon />
          </IconButton>
          <IconButton
            id={`${mapId}-${layer.layerPath}-down-order`}
            disabled={isLast}
            edge="end"
            size="small"
            onKeyDown={handleIconButtonDownKeyDown}
            onClick={() => reorderLayer(layer.layerPath, 1)}
          >
            <ArrowDownwardIcon />
          </IconButton>
        </>
      );
    }
    return null;
  }, [
    displayState,
    handleIconButtonDownKeyDown,
    handleIconButtonUpKeyDown,
    isFirst,
    isLast,
    layer.children?.length,
    layer.controls?.remove,
    layer.layerId,
    layer.layerPath,
    mapId,
    reorderLayer,
  ]);

  // Memoize the MoreLayerButtons component section
  const memoMoreLayerButtons = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoMoreLayerButtons', layer.layerPath);

    if (layer.layerStatus === 'processing' || layer.layerStatus === 'loading' || displayState !== 'view') {
      return null;
    }
    if (layer.layerStatus === 'error') {
      return <DeleteUndoButton layerPath={layer.layerPath} layerId={layer.layerId} layerRemovable={layer.controls?.remove !== false} />;
    }

    if (isLayerAlwaysVisible) {
      return (
        <IconButton edge="end" size="small" tooltip="layers.visibilityIsAlways" className="buttonOutline" disabled>
          <VisibilityOutlinedIcon color="disabled" />
        </IconButton>
      );
    }

    return (
      <IconButton edge="end" size="small" onClick={handleToggleVisibility} tooltip="layers.toggleVisibility" className="buttonOutline">
        {isVisible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
      </IconButton>
    );
  }, [
    displayState,
    handleToggleVisibility,
    isLayerAlwaysVisible,
    isVisible,
    layer.controls?.remove,
    layer.layerId,
    layer.layerPath,
    layer.layerStatus,
  ]);

  // Memoize the arrow buttons component section
  const memoArrowButtons = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoArrowButtons');

    if (layer.children?.length) {
      return (
        <IconButton
          color="primary"
          edge="end"
          size="small"
          onClick={handleExpandGroupClick}
          tooltip="layers.toggleCollapse"
          className="buttonOutline"
        >
          {legendExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      );
    }

    return null;
  }, [handleExpandGroupClick, layer.children?.length, legendExpanded]);

  // Memoize the collapse component section
  const memoCollapse = useMemo((): JSX.Element | null => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoCollapse', layer.children);

    if (!(layer.children && layer.children.length)) {
      return null;
    }

    return (
      <Collapse in={legendExpanded} timeout="auto">
        <LayersList
          depth={1 + depth}
          layersList={layer.children}
          isLayoutEnlarged={isLayoutEnlarged}
          showLayerDetailsPanel={showLayerDetailsPanel}
        />
      </Collapse>
    );
  }, [depth, isLayoutEnlarged, layer.children, legendExpanded, showLayerDetailsPanel]);

  // Memoize the container class section
  const memoContainerClass = useMemo(() => {
    // Log
    logger.logTraceUseMemo('SINGLE-LAYER - memoContainerClass');

    const result: string[] = ['layer-panel ', layer.layerStatus ?? ''];

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
  }, [depth, layer.layerStatus, layerChildIsSelected, layerIsSelected, legendExpanded]);

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
    logger.logTraceUseEffect('SINGLE-LAYER - displayState, selectedFooterLayerListItemId');

    // set the focus to first layer, after layer has been deleted.
    if (displayState === 'remove' && selectedFooterLayerListItemId.length) {
      const firstLayer = document.getElementById('layers-left-panel');
      if (firstLayer?.getElementsByTagName('li')) {
        const listItems = firstLayer?.getElementsByTagName('li');
        listItems[0]?.focus();
      }
    }
  }, [displayState, selectedFooterLayerListItemId.length]);

  const AnimatedPaper = animated(Paper);

  return (
    <AnimatedPaper className={memoContainerClass} style={listItemSpring} data-layer-depth={depth}>
      <Tooltip title={layer.layerName} placement="top" enterDelay={1000} arrow>
        <ListItem id={layer.layerId} key={layer.layerName} divider tabIndex={0} onKeyDown={handleListItemKeyDown}>
          <ListItemButton
            selected={layerIsSelected || (layerChildIsSelected && !legendExpanded)}
            tabIndex={-1}
            sx={{ minHeight: '4.51rem' }}
          >
            <LayerIcon layer={layer} />
            <ListItemText
              primary={layer.layerName !== undefined ? layer.layerName : layer.layerId}
              secondary={memoLayerDescription}
              onClick={handleLayerClick}
            />
            {!isLayoutEnlarged && (
              <ListItemIcon className="rightIcons-container">
                {memoMoreLayerButtons}
                {memoArrowButtons}
                {memoEditModeButtons}
              </ListItemIcon>
            )}
          </ListItemButton>
        </ListItem>
      </Tooltip>
      {memoCollapse}
    </AnimatedPaper>
  );
}
