import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Collapse,
  DownloadingIcon,
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
} from '@/ui';
import { TypeLegendLayer } from '../types';
import { getSxClasses } from './layerslist-style';
import { useLayerStoreActions, useSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface SingleLayerProps {
  layer: TypeLegendLayer;
  depth: number;
}

export function SingleLayer(props: SingleLayerProps): JSX.Element {
  const { layer, depth } = props;

  const layerDescription = layer.children.length ? `${layer.children.length} layers` : `${layer.items.length} items`;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const { toggleLayerVisibility, setSelectedLayerPath } = useLayerStoreActions(); // get store actions

  const selectedLayerPath = useSelectedLayerPath(); // get store value

  const layerIsSelected = layer.layerPath === selectedLayerPath;
  const legendClass = layerIsSelected ? { ...sxClasses.layersList.selectedLayerItem } : null;

  const [isGroupOpen, setGroupOpen] = useState(layerIsSelected);

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = () => {
    setGroupOpen(!isGroupOpen);
  };

  const handleLayerClick = () => {
    if (layer.children.length === 0) {
      // setSelectedLayer(layer);
      setSelectedLayerPath(layer.layerPath);
    } else {
      setGroupOpen(!isGroupOpen);
    }
  };

  const handleToggleVisibility = () => {
    toggleLayerVisibility(layer.layerPath);
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
    if (layer.children?.length) {
      return (
        <IconButton color="primary" onClick={handleExpandGroupClick}>
          {isGroupOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      );
    }
    return (
      <IconButton onClick={handleLayerClick}>
        <KeyboardArrowRightIcon />
      </IconButton>
    );
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
        <IconButton sx={{ color: 'gray' }}>
          <DownloadingIcon />
        </IconButton>
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
    <Box sx={legendClass} className="layerItemContainer">
      <ListItem key={layer.layerName} divider>
        <ListItemButton>
          {renderLayerIcon()}
          <Tooltip title={layer.layerName} placement="top" enterDelay={1000}>
            <ListItemText primary={layer.layerName} secondary={layerDescription} onClick={handleLayerClick} />
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
