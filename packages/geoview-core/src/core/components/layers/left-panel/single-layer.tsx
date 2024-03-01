import { Dispatch, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
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
} from '@/ui';
import { TypeLegendLayer } from '../types';
import {
  useLayerStoreActions,
  useLayerDisplayState,
  useLayerSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useDataTableStoreMapFilteredRecord } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { DeleteUndoButton } from './delete-undo-button';
import { LayersList } from './layers-list';
import { LayerIcon } from '../../common/layer-icon';
import { logger } from '@/core/utils/logger';
import {
  useDetailsStoreActions,
  useDetailsStoreAllFeaturesDataArray,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { LAYER_STATUS } from '@/core/utils/constant';

interface SingleLayerProps {
  layer: TypeLegendLayer;
  depth: number;
  isDragging: boolean;
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function SingleLayer({ isDragging, depth, layer, setIsLayersListPanelVisible }: SingleLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/layers/left-panel/single-layer');

  const { t } = useTranslation<string>();

  // Get store states
  const { setSelectedLayerPath } = useLayerStoreActions();
  const { getAlwaysVisibleFromOrderedLayerInfo, getVisibilityFromOrderedLayerInfo, setOrToggleLayerVisibility } = useMapStoreActions();
  const selectedLayerPath = useLayerSelectedLayerPath();
  const displayState = useLayerDisplayState();
  const mapFiltered = useDataTableStoreMapFilteredRecord();
  const layerData = useDetailsStoreAllFeaturesDataArray();

  const { triggerGetAllFeatureInfo } = useDetailsStoreActions();

  // if any of the chiild layers is selected return true
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

  // returns true if any of the layer children or items has visibility of 'always'
  const layerHasAlwaysVisible = (startingLayer: TypeLegendLayer): boolean => {
    if (getAlwaysVisibleFromOrderedLayerInfo(layer.layerPath)) {
      return true;
    }
    let itemsHasAlways = false;
    let childrenHasAlways = false;
    if (startingLayer.children && startingLayer.children.length > 0) {
      childrenHasAlways = _.some(startingLayer.children, (child) => layerHasAlwaysVisible(child));
    }
    if (startingLayer.items && startingLayer.items.length) {
      itemsHasAlways = startingLayer.items.filter((i) => i.isVisible === 'always').length > 0;
    }

    return itemsHasAlways || childrenHasAlways;
  };

  const isLayerAlwaysVisible = layerHasAlwaysVisible(layer);

  const [isGroupOpen, setGroupOpen] = useState(layerIsSelected || layerChildIsSelected);

  // get layer description
  const getLayerDescription = () => {
    if (layer.layerStatus === 'error') {
      return t('legend.layerError');
    }
    if (layer.layerStatus === 'processing' || layer.layerStatus === 'loading') {
      return t('legend.layerLoading');
    }

    if (layer.children.length > 0) {
      return t('legend.subLayersCount').replace('{count}', layer.children.length.toString());
    }

    const count = layer.items.filter((d) => d.isVisible !== 'no').length;
    const totalCount = layer.items.length;
    const itemsLengthDesc = t('legend.itemsCount').replace('{count}', count.toString()).replace('{totalCount}', totalCount.toString());

    if (mapFiltered[layer.layerPath]) {
      return (
        <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'left', gap: 1 }}>
          <span>{itemsLengthDesc} </span>
          <TableViewIcon />
        </Box>
      );
    }
    return itemsLengthDesc;
  };

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = () => {
    setGroupOpen(!isGroupOpen);
  };

  const handleLayerClick = () => {
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
        triggerGetAllFeatureInfo(layer.layerPath, 'all');
      }
    }
  };

  const handleToggleVisibility = () => {
    setOrToggleLayerVisibility(layer.layerPath);
  };

  const handleReloadLayer = () => {
    logger.logWarning('reloading layer not implemented...');
  };

  // TODO: refactor - this button function does nothing as it is the whole container that can be draggable
  const handleReArrangeLayer = () => {
    logger.logWarning('re-arrange layer');
  };

  function renderEditModeButtons() {
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

  function renderMoreLayerButtons() {
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

  function renderArrowButtons() {
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

  function renderCollapsible() {
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

  function getContainerClass() {
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

  return (
    <Box className={getContainerClass()} data-layer-depth={depth}>
      <ListItem key={layer.layerName} divider>
        <ListItemButton selected={layerIsSelected || (layerChildIsSelected && !isGroupOpen)}>
          <LayerIcon layer={layer} />
          <Tooltip title={layer.layerName} placement="top" enterDelay={1000}>
            <ListItemText
              primary={layer.layerName !== undefined ? layer.layerName : layer.layerId}
              secondary={getLayerDescription()}
              onClick={handleLayerClick}
            />
          </Tooltip>
          <ListItemIcon className="rightIcons-container">
            {renderMoreLayerButtons()}
            {renderArrowButtons()}
            {renderEditModeButtons()}
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      {renderCollapsible()}
    </Box>
  );
}
