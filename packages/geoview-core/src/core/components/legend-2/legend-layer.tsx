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
  DownloadingIcon,
  ListAltIcon,
} from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './legend-styles';

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

  // renders the layers children, if any
  function renderChildren() {
    if (!layer.children?.length) {
      return null;
    }

    return (
      <List sx={{ width: '100%', padding: '20px', margin: '20px 0px' }}>
        {layer.children
          .filter((d) => d.isVisible)
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
        {layer.items.map((item) => (
          <ListItem key={item.name} className={!item.isChecked ? 'unchecked' : ''}>
            <ListItemIcon>
              <img alt={item.name} src={item.icon} />
            </ListItemIcon>
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
    <Box sx={sxClasses.legendLayerListItem}>
      <ListItem key={layer.layerName} divider onClick={handleExpandGroupClick}>
        {renderLayerIcon()}
        <Tooltip title={layer.layerName} placement="top" enterDelay={1000}>
          <ListItemText primary={layer.layerName} className="layerTitle" />
        </Tooltip>
      </ListItem>
      {renderCollapsible()}
    </Box>
  );
}
