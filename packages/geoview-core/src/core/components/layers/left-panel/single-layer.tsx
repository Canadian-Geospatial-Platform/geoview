import { Dispatch, SetStateAction, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Collapse,
  ErrorIcon,
  GroupWorkOutlinedIcon,
  IconButton,
  KeyboardArrowDownIcon,
  KeyboardArrowRightIcon,
  KeyboardArrowUpIcon,
  List,
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
import { getSxClasses } from './layerslist-style';
import {
  useLayerStoreActions,
  useLayersDisplayState,
  useSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useDataTableStoreMapFilteredRecord } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { IconStack } from '../../icon-stack/icon-stack';
import { DeleteUndoButton } from './delete-undo-button';

interface SingleLayerProps {
  layer: TypeLegendLayer;
  depth: number;
  setIsLayersListPanelVisible: Dispatch<SetStateAction<boolean>> | undefined;
}

export function SingleLayer(props: SingleLayerProps): JSX.Element {
  const { layer, depth, setIsLayersListPanelVisible } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const { t } = useTranslation<string>();

  const { toggleLayerVisibility, setSelectedLayerPath } = useLayerStoreActions(); // get store actions

  const selectedLayerPath = useSelectedLayerPath(); // get store value
  const displayState = useLayersDisplayState();
  const mapFiltered = useDataTableStoreMapFilteredRecord();

  const layerIsSelected = layer.layerPath === selectedLayerPath && displayState === 'view';

  const [isGroupOpen, setGroupOpen] = useState(layerIsSelected);

  // get layer description
  const getLayerDescription = () => {
    if (layer.layerStatus === 'error') {
      return t('legend.layerError');
    }
    if (layer.layerStatus === 'loading') {
      return t('legend.layerLoading');
    }
    if (layer.children.length) {
      return `${layer.children.length} layers`;
    }
    if (mapFiltered[layer.layerPath]) {
      return (
        <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'left', gap: 1 }}>
          <span>{layer.items.length} items </span>
          <TableViewIcon />
        </Box>
      );
    }
    return `${layer.items.length} items`;
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
    if (layer.children.length === 0) {
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

  // renders the layers children, if any
  function renderChildren() {
    if (!layer.children?.length) {
      return null;
    }

    return (
      <List sx={depth % 2 ? sxClasses.evenDepthList : sxClasses.oddDepthList}>
        {layer.children.map((item) => (
          <SingleLayer depth={1 + depth} layer={item} key={item.layerPath} setIsLayersListPanelVisible={setIsLayersListPanelVisible} />
        ))}
      </List>
    );
  }

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
    if (!(layer.children?.length || layer.items?.length)) {
      return null;
    }

    return (
      <Collapse in={isGroupOpen} timeout="auto">
        {renderChildren()}
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

  return (
    <Box className={`layerItemContainer ${layer.layerStatus} ${layerIsSelected ? 'selectedLayer' : ''}`}>
      <ListItem key={layer.layerName} divider>
        <ListItemButton selected={layerIsSelected}>
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
