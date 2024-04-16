import { Dispatch, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { animated, useSpring } from '@react-spring/web';
import {
  Box,
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
  RestartAltIcon,
  TableViewIcon,
  HandleIcon,
  Paper,
} from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import {
  useLayerStoreActions,
  useLayerDisplayState,
  useLayerSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { DeleteUndoButton } from './delete-undo-button';
import { LayersList } from './layers-list';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { logger } from '@/core/utils/logger';
import {
  useDataTableLayerSettings,
  useDataTableStoreActions,
  useDataTableAllFeaturesDataArray,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { LAYER_STATUS } from '@/core/utils/constant';
import { Theme } from '@mui/material';

interface SingleLayerProps {
  layer: TypeLegendLayer;
  depth: number;
  isDragging: boolean;
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
  index: number;
}

export function SingleLayer({ isDragging, depth, layer, setIsLayersListPanelVisible, index }: SingleLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/single-layer');

  const { t } = useTranslation<string>();

  // Get store states
  const { setSelectedLayerPath } = useLayerStoreActions();
  const { getVisibilityFromOrderedLayerInfo, setOrToggleLayerVisibility } = useMapStoreActions();
  const selectedLayerPath = useLayerSelectedLayerPath();
  const displayState = useLayerDisplayState();
  const datatableSettings = useDataTableLayerSettings();

  const layerData = useDataTableAllFeaturesDataArray();

  const { triggerGetAllFeatureInfo } = useDataTableStoreActions();

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

  const [isGroupOpen, setGroupOpen] = useState(layerIsSelected || layerChildIsSelected);

  // get layer description
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

    if (totalCount <= 1 && datatableSettings[layer.layerPath]) {
      return (<span>&nbsp;</span>);
    }

    const itemsLengthDesc = t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());

    /*if (datatableSettings[layer.layerPath]) {
      return (
        <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'left', gap: 1 }}>
          <span>{itemsLengthDesc} </span>
          <TableViewIcon fontSize="small" />
        </Box>
      );
    }*/
    return itemsLengthDesc;
  };

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = (): void => {
    setGroupOpen(!isGroupOpen);
  };

  const handleLayerClick = (): void => {
    if (!['processed', 'loaded'].includes(layer.layerStatus!)) {
      return;
    }

    setSelectedLayerPath(layer.layerPath);
    if (setIsLayersListPanelVisible) {
      if (layer.children.length > 0) {
        setGroupOpen(true);
      }
      setIsLayersListPanelVisible(true);
      // trigger the fetching of the features when not available OR when layer status is in error
      if (
        !layerData.filter((layers) => layers.layerPath === layer.layerPath && !!layers?.features?.length).length ||
        layer.layerStatus === LAYER_STATUS.ERROR
      ) {
        triggerGetAllFeatureInfo(layer.layerPath);
      }
    }
  };

  const handleLayerKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') handleLayerClick();
  };

  const handleToggleVisibility = (): void => {
    setOrToggleLayerVisibility(layer.layerPath);
  };

  const handleReloadLayer = (): void => {
    logger.logWarning('reloading layer not implemented...');
  };

  // TODO: refactor - this button function does nothing as it is the whole container that can be draggable
  const handleReArrangeLayer = (): void => {
    logger.logWarning('re-arrange layer');
  };

  function renderEditModeButtons(): JSX.Element | null {
    if (displayState === 'remove' || layer.layerStatus === 'error') {
      return <DeleteUndoButton layer={layer} />;
    }
    if (displayState === 'order') {
      return (
        <IconButton edge="end" size="small" onClick={handleReArrangeLayer}>
          <HandleIcon color="error" />
        </IconButton>
      );
    }
    return null;
  }

  function renderMoreLayerButtons(): JSX.Element | null {
    if (layer.layerStatus === 'processing' || layer.layerStatus === 'loading' || displayState !== 'view') {
      return null;
    }
    if (layer.layerStatus === 'error') {
      return (
        <IconButton edge="end" size="small" onClick={handleReloadLayer} tooltip="layers.reloadLayer" className="style1">
          <RestartAltIcon />
        </IconButton>
      );
    }

    if (isLayerAlwaysVisible) {
      return (
        <IconButton edge="end" size="small" tooltip="layers.visibilityIsAlways" className="style1" disabled>
          <VisibilityOutlinedIcon color="disabled" />
        </IconButton>
      );
    }

    return (
      <IconButton edge="end" size="small" onClick={() => handleToggleVisibility()} tooltip="layers.toggleVisibility" className="style1">
        {(() => {
          if (!getVisibilityFromOrderedLayerInfo(layer.layerPath)) return <VisibilityOffOutlinedIcon />;
          return <VisibilityOutlinedIcon />;
        })()}
      </IconButton>
    );
  }

  function renderArrowButtons(): JSX.Element | null {
    if (!['processed', 'loaded'].includes(layer.layerStatus!)) {
      return null;
    }
    if (layer.children?.length) {
      return (
        <IconButton
          color="primary"
          edge="end"
          size="small"
          onClick={handleExpandGroupClick}
          tooltip="layers.toggleCollapse"
          className="style1"
        >
          {isGroupOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
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
      <Collapse in={isGroupOpen} timeout="auto">
        <LayersList
          parentLayerPath={layer.layerPath}
          depth={1 + depth}
          layersList={layer.children}
          setIsLayersListPanelVisible={setIsLayersListPanelVisible}
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
    if (layerChildIsSelected && !layerIsSelected && !isGroupOpen) {
      result.push('selectedLayer bordered-primary');
    }

    if (layerIsSelected) {
      result.push('selectedLayer bordered-primary');
    }

    if (isDragging) {
      result.push('dragging');
    }

    return result.join(' ');
  }

  const listItemSpring = useSpring({
    delay: index * 150 + (depth * 150) / 2,
    from: { opacity: 0.1 },
    to: { opacity: 1 },
  });

  const AnimatedPaper = animated(Paper);

  return (
    <AnimatedPaper className={getContainerClass()} style={listItemSpring} data-layer-depth={depth}>
      <Tooltip title={layer.layerName} placement="top" enterDelay={1000} arrow>
        <ListItem key={layer.layerName} divider tabIndex={0} onKeyDown={(e) => handleLayerKeyDown(e)}>
          <ListItemButton selected={layerIsSelected || (layerChildIsSelected && !isGroupOpen)} tabIndex={-1}>
            <LayerIcon layer={layer} />
            <ListItemText
              primary={layer.layerName !== undefined ? layer.layerName : layer.layerId}
              secondary={getLayerDescription()}
              onClick={handleLayerClick}
            />
            <ListItemIcon className="rightIcons-container">
              {renderMoreLayerButtons()}
              {renderArrowButtons()}
              {renderEditModeButtons()}
            </ListItemIcon>
          </ListItemButton>
        </ListItem>
      </Tooltip>
      {renderCollapsible()}
    </AnimatedPaper>
  );
}
