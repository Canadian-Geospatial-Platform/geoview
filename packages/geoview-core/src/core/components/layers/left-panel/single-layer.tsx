import { useState } from 'react';
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
  ListAltIcon,
  Tooltip,
  VisibilityOffOutlinedIcon,
  VisibilityOutlinedIcon,
  RestartAltIcon,
  CircularProgressBase,
  TableViewIcon,
} from '@/ui';
import { TypeLegendLayer } from '../types';
import { getSxClasses } from './layerslist-style';
import { useLayerStoreActions, useSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useDataTableStoreMapFilteredRecord } from '@/core/stores/store-interface-and-intial-values/data-table-state';

interface SingleLayerProps {
  layer: TypeLegendLayer;
  depth: number;
}

export function SingleLayer(props: SingleLayerProps): JSX.Element {
  const { layer, depth } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const { t } = useTranslation<string>();

  const { toggleLayerVisibility, setSelectedLayerPath } = useLayerStoreActions(); // get store actions

  const selectedLayerPath = useSelectedLayerPath(); // get store value
  const mapFiltered = useDataTableStoreMapFilteredRecord();

  const layerIsSelected = layer.layerPath === selectedLayerPath;
  const legendClass = layerIsSelected ? { ...sxClasses.layersList.selectedLayerItem } : null;

  const [isGroupOpen, setGroupOpen] = useState(layerIsSelected);

  // get layer description
  const getLayerDescription = () => {
    if (layer.layerStatus === 'error') {
      return t('legend.layer_has_error');
    }
    if (layer.layerStatus === 'loading') {
      return t('legend.layer_is_loading');
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
    if (!['processed', 'loaded'].includes(layer.layerStatus)) {
      return;
    }
    if (layer.children.length === 0) {
      setSelectedLayerPath(layer.layerPath);
    } else {
      setGroupOpen(!isGroupOpen);
    }
  };

  const handleToggleVisibility = () => {
    toggleLayerVisibility(layer.layerPath);
  };

  const handleReloadLayer = () => {
    console.log('reloading layer');
  };

  // renders the layers children, if any
  function renderChildren() {
    if (!layer.children?.length) {
      return null;
    }

    return (
      <List sx={depth % 2 ? sxClasses.evenDepthList : sxClasses.oddDepthList}>
        {layer.children.map((item) => (
          <SingleLayer depth={1 + depth} layer={item} key={item.layerPath} />
        ))}
      </List>
    );
  }

  function renderMoreLayerButtons() {
    if (layer.layerStatus === 'loading') {
      return null;
    }
    if (layer.layerStatus === 'error') {
      return (
        <IconButton onClick={handleReloadLayer}>
          <RestartAltIcon />
        </IconButton>
      );
    }

    return (
      <IconButton color="primary" onClick={() => handleToggleVisibility()}>
        {(() => {
          if (layer.isVisible === false) return <VisibilityOffOutlinedIcon />;
          return <VisibilityOutlinedIcon />;
        })()}
      </IconButton>
    );
  }

  function renderArrowButtons() {
    if (!['processed', 'loaded'].includes(layer.layerStatus)) {
      return null;
    }
    if (layer.children?.length) {
      return (
        <IconButton color="primary" onClick={handleExpandGroupClick}>
          {isGroupOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      );
    }
    if (layer.items?.length) {
      return (
        <IconButton onClick={handleLayerClick}>
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
    return (
      <IconButton color="success">
        <ListAltIcon />
      </IconButton>
    );
  }

  return (
    <Box sx={legendClass} className={`layerItemContainer ${layer.layerStatus}`}>
      <ListItem key={layer.layerName} divider>
        <ListItemButton>
          {renderLayerIcon()}
          <Tooltip title={layer.layerName} placement="top" enterDelay={1000}>
            <ListItemText primary={layer.layerName} secondary={getLayerDescription()} onClick={handleLayerClick} />
          </Tooltip>
          <ListItemIcon style={{ justifyContent: 'right' }}>
            {renderMoreLayerButtons()}
            {renderArrowButtons()}
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      {renderCollapsible()}
    </Box>
  );
}
