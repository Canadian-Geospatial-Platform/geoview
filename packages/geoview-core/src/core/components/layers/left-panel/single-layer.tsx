import { useEffect } from 'react';
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
  useLayerLegendLayers,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
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
  showLayerDetailsPanel: (layer: TypeLegendLayer) => void;
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
  logger.logTraceRender('components/layers/left-panel/single-layer');

  const { t } = useTranslation<string>();

  // Get store states
  const { setSelectedLayerPath, setSelectedLayerSortingArrowId } = useLayerStoreActions();
  const {
    getVisibilityFromOrderedLayerInfo,
    setOrToggleLayerVisibility,
    getLegendCollapsedFromOrderedLayerInfo,
    setLegendCollapsed,
    reorderLayer,
  } = useMapStoreActions();

  const mapId = useGeoViewMapId();
  const selectedLayerPath = useLayerSelectedLayerPath();
  const displayState = useLayerDisplayState();
  const datatableSettings = useDataTableLayerSettings();
  const selectedLayerSortingArrowId = useSelectedLayerSortingArrowId();
  const selectedFooterLayerListItemId = useUISelectedFooterLayerListItemId();
  const legendLayers = useLayerLegendLayers();

  useDataTableStoreActions();

  const legendExpanded = !getLegendCollapsedFromOrderedLayerInfo(layer.layerPath);

  // if any of the child layers is selected return true
  const isLayerChildSelected = (startingLayer: TypeLegendLayer): boolean => {
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
  };

  const layerChildIsSelected = isLayerChildSelected(layer);
  const layerIsSelected = layer.layerPath === selectedLayerPath && displayState === 'view';

  // returns true if any of the layer children has visibility of false
  const layerHasDisabledVisibility = (startingLayer: TypeLegendLayer): boolean => {
    if (startingLayer.controls?.visibility === false) {
      return true;
    }
    let childrenHasAlways = false;
    if (startingLayer.children && startingLayer.children.length > 0) {
      childrenHasAlways = startingLayer.children.some((child) => layerHasDisabledVisibility(child));
    }

    return childrenHasAlways;
  };

  const isLayerAlwaysVisible = layerHasDisabledVisibility(layer);

  // Get layer description
  const getLayerDescription = (): JSX.Element | string | null => {
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
  };

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = (): void => {
    setLegendCollapsed(layer.layerPath);
  };

  const handleLayerClick = (): void => {
    // Only clickable if the layer status is processed or loaded
    if (!['processed', 'loaded'].includes(layer.layerStatus!)) {
      return;
    }

    setSelectedLayerPath(layer.layerPath);
    if (showLayerDetailsPanel) {
      showLayerDetailsPanel(layer);
    }
  };

  const handleToggleVisibility = (): void => {
    setOrToggleLayerVisibility(layer.layerPath);
  };

  function renderEditModeButtons(): JSX.Element | null {
    if (displayState === 'remove') {
      return <DeleteUndoButton layer={layer} />;
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
            onClick={() => reorderLayer(layer.layerPath, -1)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSelectedLayerSortingArrowId(`${mapId}-${layer.layerPath}-up-order`);
                reorderLayer(layer.layerPath, -1);
                e.preventDefault();
              }
            }}
          >
            <ArrowUpIcon />
          </IconButton>
          <IconButton
            id={`${mapId}-${layer.layerPath}-down-order`}
            disabled={isLast}
            edge="end"
            size="small"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSelectedLayerSortingArrowId(`${mapId}-${layer.layerPath}-down-order`);
                reorderLayer(layer.layerPath, 1);
                e.preventDefault();
              }
            }}
            onClick={() => reorderLayer(layer.layerPath, 1)}
          >
            <ArrowDownwardIcon />
          </IconButton>
        </>
      );
    }
    return null;
  }

  function renderMoreLayerButtons(): JSX.Element | null {
    if (layer.layerStatus === 'processing' || layer.layerStatus === 'loading' || displayState !== 'view') {
      return null;
    }
    if (layer.layerStatus === 'error') {
      return <DeleteUndoButton layer={layer} />;
    }

    if (isLayerAlwaysVisible) {
      return (
        <IconButton edge="end" size="small" tooltip="layers.visibilityIsAlways" className="buttonOutline" disabled>
          <VisibilityOutlinedIcon color="disabled" />
        </IconButton>
      );
    }

    return (
      <IconButton
        edge="end"
        size="small"
        onClick={() => handleToggleVisibility()}
        tooltip="layers.toggleVisibility"
        className="buttonOutline"
      >
        {(() => {
          if (!getVisibilityFromOrderedLayerInfo(layer.layerPath)) return <VisibilityOffOutlinedIcon />;
          return <VisibilityOutlinedIcon />;
        })()}
      </IconButton>
    );
  }

  function renderArrowButtons(): JSX.Element | null {
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
  }

  function renderCollapsible(): JSX.Element | null {
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
  }

  function getContainerClass(): string {
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
  }

  const listItemSpring = useSpring({
    delay: index * 150 + (depth * 150) / 2,
    from: { opacity: 0.1 },
    to: { opacity: 1 },
  });

  useEffect(() => {
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
    // set the focus to first layer, after layer has been deleted.
    if (displayState === 'remove' && selectedFooterLayerListItemId.length) {
      const firstLayer = document.getElementById('layers-left-panel');
      if (firstLayer?.getElementsByTagName('li')) {
        const listItems = firstLayer?.getElementsByTagName('li');
        listItems[0]?.focus();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legendLayers, displayState]);

  const AnimatedPaper = animated(Paper);

  return (
    <AnimatedPaper className={getContainerClass()} style={listItemSpring} data-layer-depth={depth}>
      <Tooltip title={layer.layerName} placement="top" enterDelay={1000} arrow>
        <ListItem
          id={layer.layerId}
          key={layer.layerName}
          divider
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget === e.target && handleLayerClick()}
        >
          <ListItemButton
            selected={layerIsSelected || (layerChildIsSelected && !legendExpanded)}
            tabIndex={-1}
            sx={{ minHeight: '4.51rem' }}
          >
            <LayerIcon layer={layer} />
            <ListItemText
              primary={layer.layerName !== undefined ? layer.layerName : layer.layerId}
              secondary={getLayerDescription()}
              onClick={handleLayerClick}
            />
            {!isLayoutEnlarged && (
              <ListItemIcon className="rightIcons-container">
                {renderMoreLayerButtons()}
                {renderArrowButtons()}
                {renderEditModeButtons()}
              </ListItemIcon>
            )}
          </ListItemButton>
        </ListItem>
      </Tooltip>
      {renderCollapsible()}
    </AnimatedPaper>
  );
}
