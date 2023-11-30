import { useState } from 'react';
import { useTheme } from '@mui/material';
import {
  Box,
  ListItem,
  Tooltip,
  ListItemText,
  ListItemIcon,
  IconButton,
  Collapse,
  List,
  GroupWorkOutlinedIcon,
  ErrorIcon,
  BrowserNotSupportedIcon,
  CircularProgressBase,
} from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './legend-styles';
import { IconStack } from '../icon-stack/icon-stack';

interface LegendLayerProps {
  layer: TypeLegendLayer;
}

export function LegendLayer(props: LegendLayerProps): JSX.Element {
  const { layer } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [isGroupOpen, setGroupOpen] = useState(true);

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = () => {
    setGroupOpen(!isGroupOpen);
  };

  const getSecondaryText = () => {
    if (layer.children.length) {
      return `${layer.children.length} sub-layers`;
    }
    if (layer.items.length) {
      return `${layer.items.filter((d) => d.isVisible).length} of ${layer.items.length} items`;
    }

    return '';
  };

  // renders the layers children, if any
  function renderChildren() {
    if (!layer.children?.length) {
      return null;
    }

    return (
      <List sx={{ width: '100%', padding: '20px', margin: '20px 0px' }}>
        {layer.children
          .filter((d) => d.isVisible && !['error', 'loading'].includes(d.layerStatus ?? ''))
          .map((item) => (
            <LegendLayer layer={item} key={item.layerPath} />
          ))}
      </List>
    );
  }

  // renders the layers items if any
  function renderItems() {
    if (!layer.items?.length) {
      return null;
    }
    return (
      <List sx={{ width: '100%' }}>
        {layer.items
          .filter((d) => d.isVisible)
          .map((item) => (
            <ListItem key={item.name} className={!item.isVisible ? 'unchecked' : ''}>
              <ListItemIcon>{item.icon ? <img alt={item.name} src={item.icon} /> : <BrowserNotSupportedIcon />}</ListItemIcon>
              <Tooltip title={item.name} placement="top" enterDelay={1000}>
                <ListItemText primary={item.name} />
              </Tooltip>
            </ListItem>
          ))}
      </List>
    );
  }

  function renderCollapsible() {
    if (!(layer.children?.length || layer.items?.length)) {
      return null;
    }

    return (
      <Collapse in sx={sxClasses.collapsibleContainer} timeout="auto">
        {renderChildren()}
        {renderItems()}
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
        <IconStack layerPath={layer.layerPath} />
      </IconButton>
    );
  }

  return (
    <Box sx={sxClasses.legendLayerListItem}>
      <ListItem key={layer.layerName} divider onClick={handleExpandGroupClick}>
        {renderLayerIcon()}
        <Tooltip title={layer.layerName} placement="top" enterDelay={1000}>
          <ListItemText primary={layer.layerName} className="layerTitle" secondary={getSecondaryText()} />
        </Tooltip>
      </ListItem>
      {renderCollapsible()}
    </Box>
  );
}
