import { Dispatch, SetStateAction, useState } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import {
  Box,
  Collapse,
  ErrorIcon,
  GroupWorkOutlinedIcon,
  IconButton,
  KeyboardArrowDownIcon,
  KeyboardArrowRightIcon,
  KeyboardArrowUpIcon,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  VisibilityOffOutlinedIcon,
  VisibilityOutlinedIcon,
  RestartAltIcon,
  CircularProgressBase,
  TableViewIcon,
  HandleIcon,
} from '@/ui';
import { TypeLegendLayer } from '../types';
import {
  useLayerStoreActions,
  useLayersDisplayState,
  useSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useDataTableStoreMapFilteredRecord } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { IconStack } from '../../icon-stack/icon-stack';
import { DeleteUndoButton } from './delete-undo-button';
import { LayersList } from './layers-list';

interface SingleLayerProps {
  layer: TypeLegendLayer;
  depth: number;
  isDragging: boolean;
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>>;
}

export function SingleLayer({ isDragging, depth, layer, setIsLayersListPanelVisible }: SingleLayerProps): JSX.Element {
  const { t } = useTranslation<string>();

  const { toggleLayerVisibility, setSelectedLayerPath } = useLayerStoreActions(); // get store actions

  const selectedLayerPath = useSelectedLayerPath(); // get store value
  const displayState = useLayersDisplayState();
  const mapFiltered = useDataTableStoreMapFilteredRecord();

  const isLayerOrChildSelected = (startingLayer: TypeLegendLayer): boolean => {
    if (startingLayer.layerPath === selectedLayerPath && displayState === 'view') {
      return true;
    }
    if (startingLayer.children && startingLayer.children.length > 0) {
      return _.some(startingLayer.children, (child) => isLayerOrChildSelected(child));
    }
    return false;
  };

  const isLayerSelected = isLayerOrChildSelected(layer);

  const [isGroupOpen, setGroupOpen] = useState(isLayerSelected);

  // get layer description
  const getLayerDescription = () => {
    if (layer.layerStatus === 'error') {
      return t('legend.layerError');
    }
    if (layer.layerStatus === 'loading') {
      return t('legend.layerLoading');
    }

    const validChildren = layer.children?.filter((c) => c.isVisible !== 'no' && ['processed', 'loaded'].includes(c.layerStatus ?? ''));
    if (validChildren.length) {
      return t('legend.subLayersCount').replace('{count}', validChildren.length.toString());
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

    if (layer.children && layer.children.length === 0) {
      setSelectedLayerPath(layer.layerPath);
      if (setIsLayersListPanelVisible) setIsLayersListPanelVisible(true);
    } else {
      setGroupOpen(!isGroupOpen);
    }
  };

  const handleToggleVisibility = () => {
    toggleLayerVisibility(layer.layerPath);
  };

  const handleReloadLayer = () => {
    // eslint-disable-next-line no-console
    console.log('reloading layer');
  };

  const handleReArrangeLayer = () => {
    // eslint-disable-next-line no-console
    console.log('re-arrange layer');
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
    if (layer.layerStatus === 'loading' || displayState !== 'view') {
      return null;
    }
    if (layer.layerStatus === 'error') {
      return (
        <IconButton edge="end" size="small" onClick={handleReloadLayer}>
          <RestartAltIcon />
        </IconButton>
      );
    }

    if (layer.isVisible === 'always') {
      return null;
    }

    return (
      <IconButton color="primary" edge="end" size="small" onClick={() => handleToggleVisibility()}>
        {(() => {
          if (layer.isVisible === 'no') return <VisibilityOffOutlinedIcon />;
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
        <IconButton color="primary" edge="end" size="small" onClick={handleExpandGroupClick}>
          {isGroupOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      );
    }
    if (displayState === 'view') {
      return (
        <IconButton edge="end" size="small" onClick={handleLayerClick}>
          <KeyboardArrowRightIcon />
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
      <Collapse in={isGroupOpen || isLayerSelected} timeout="auto">
        <LayersList
          parentLayerPath={layer.layerPath}
          depth={1 + depth}
          layersList={layer.children}
          setIsLayersListPanelVisible={setIsLayersListPanelVisible}
        />
      </Collapse>
    );
  }

  function renderLayerIcon() {
    if (layer.layerStatus === 'error') {
      return (
        <IconButton sx={{ color: 'red' }}>
          <ErrorIcon />
        </IconButton>
      );
    }
    if (layer.layerStatus === 'loading') {
      return (
        <Box sx={{ padding: '5px', marginRight: '10px' }}>
          <CircularProgressBase size={20} />
        </Box>
      );
    }
    if (layer?.children.length) {
      return (
        <IconButton color="primary">
          <GroupWorkOutlinedIcon />
        </IconButton>
      );
    }
    return <IconStack layerPath={layer.layerPath} />;
  }

  function getContainerClass() {
    const result: string[] = ['layerItemContainer', layer.layerStatus ?? ''];

    if (isLayerSelected) {
      result.push('selectedLayer');
    }

    if (isDragging) {
      result.push('dragging');
    }

    return result.join(' ');
  }

  return (
    <Box className={getContainerClass()}>
      <ListItem key={layer.layerName} divider>
        <ListItemButton selected={isLayerSelected}>
          {renderLayerIcon()}
          <Tooltip title={layer.layerName} placement="top" enterDelay={1000}>
            <ListItemText
              primary={layer.layerName !== undefined ? layer.layerName : layer.metadataAccessPath}
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
