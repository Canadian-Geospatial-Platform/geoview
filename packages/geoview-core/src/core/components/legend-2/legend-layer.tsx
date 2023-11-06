import { useState } from 'react';
import { useTheme } from '@mui/material';
import {
  Box,
  ListItem,
  Tooltip,
  ListItemText,
  ListItemIcon,
  IconButton,
  KeyboardArrowDownIcon,
  Collapse,
  List,
  KeyboardArrowUpIcon,
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
        {layer.children.map((item) => (
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
          <ListItem key={item.name}>
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

  function renderArrowButtons() {
    if (layer.children?.length || layer.items?.length) {
      return (
        <ListItemIcon style={{ justifyContent: 'right' }}>
          <IconButton color="primary">{isGroupOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}</IconButton>
        </ListItemIcon>
      );
    }
    return null;
  }

  function renderCollapsible() {
    if (!(layer.children?.length || layer.items?.length)) {
      return null;
    }

    return (
      <Collapse in={isGroupOpen} sx={sxClasses.collapsibleContainer} timeout="auto">
        {renderChildren()}
        {renderItems()}
      </Collapse>
    );
  }

  return (
    <Box>
      <ListItem key={layer.layerName} sx={sxClasses.legendLayerListItem} divider onClick={handleExpandGroupClick}>
        <Tooltip title={layer.layerName} placement="top" enterDelay={1000}>
          <ListItemText primary={layer.layerName} />
        </Tooltip>
        {renderArrowButtons()}
      </ListItem>
      {renderCollapsible()}
    </Box>
  );
}
