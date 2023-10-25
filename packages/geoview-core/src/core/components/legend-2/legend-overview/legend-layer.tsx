
import { useTranslation } from 'react-i18next';
import { TypeDisplayLanguage, sxClasses } from '@/app';
import { Box, ListItem, Tooltip, ListItemText, ListItemIcon, IconButton, KeyboardArrowDownIcon, Collapse, List, KeyboardArrowUpIcon } from '@/ui';
import { TypeLegendLayer } from '../types';
import { useState } from 'react';
import { getSxClasses } from './legend-overview-styles';
import { useTheme } from '@mui/material';

interface LegendLayerProps {
  layer: TypeLegendLayer
}

export function LegendLayer(props: LegendLayerProps): JSX.Element {
  const { layer } = props;
  const { t, i18n } = useTranslation<string>();
  const layerName = layer.layerName[i18n.language as TypeDisplayLanguage];
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const [isGroupOpen, setGroupOpen] = useState(true);
  

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = () => {
    setGroupOpen(!isGroupOpen);
  };


  //renders the layers children, if any
  function renderChildren() {
    if(!layer.children?.length) { return null; }

    return (
      <List sx={{ width: '100%', padding: '20px', margin:'20px 0px' }}>
        {layer.children.map((item) => <LegendLayer layer={item} /> )}
      </List>
    );
  }

  //renders the layers items if any
  function renderItems() {
    if(!layer.children?.length) { return null; }
    return (
      <List sx={{ width: '100%' }}>
        {layer.children.map((item) => <LegendLayer layer={item} /> )}
      </List>
    );
  }

  function renderArrowButtons() {
    if(layer.children?.length || layer.items?.length) {
      return (
        <ListItemIcon style={{ justifyContent: 'right' }}>
          <IconButton color="primary">
            {isGroupOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
          </IconButton>
        </ListItemIcon>
      )
    } else {
      return null;
    }
  }

  function renderCollapsible() {
    if(!(layer.children?.length || layer.items?.length)) {
      return null;
    }

    return (
      <Collapse in={isGroupOpen} sx={sxClasses.collapsibleContainer}  timeout="auto">
        {renderChildren()}
      </Collapse>
    )
  }

  return (
    <Box>
      <ListItem key={layerName} sx={sxClasses.legendLayerListItem} divider onClick={handleExpandGroupClick}>
        <Tooltip title={layerName} placement="top" enterDelay={1000}>
          <ListItemText primary={layerName} />
        </Tooltip>
        {renderArrowButtons()}
      </ListItem>
      {renderCollapsible()}
    </Box>
  );
}