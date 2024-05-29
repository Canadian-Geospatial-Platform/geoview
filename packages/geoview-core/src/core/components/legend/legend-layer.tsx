import { useState } from 'react';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  Box,
  ListItem,
  Tooltip,
  ListItemText,
  ListItemIcon,
  Collapse,
  List,
  BrowserNotSupportedIcon,
  IconButton,
  KeyboardArrowDownIcon,
  KeyboardArrowUpIcon,
  Stack,
  VisibilityOutlinedIcon,
  HighlightOutlinedIcon,
  ZoomInSearchIcon,
  Typography,
  VisibilityOffOutlinedIcon,
  HighlightIcon,
} from '@/ui';
import { useLayerHighlightedLayer, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useMapStoreActions } from '@/core/stores/';
import { getSxClasses } from './legend-styles';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { logger } from '@/core/utils/logger';

interface LegendLayerProps {
  layer: TypeLegendLayer;
}

export function LegendLayer(props: LegendLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/legend/legend-layer');

  const { layer } = props;

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [isGroupOpen, setGroupOpen] = useState(true);

  // get store actions
  const highlightedLayer = useLayerHighlightedLayer();
  const { getVisibilityFromOrderedLayerInfo, setOrToggleLayerVisibility } = useMapStoreActions();
  const { setHighlightLayer, zoomToLayerExtent } = useLayerStoreActions();

  const getLayerChildren = (): TypeLegendLayer[] => {
    return layer.children?.filter((c) => ['processed', 'loaded'].includes(c.layerStatus ?? ''));
  };

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = (): void => {
    setGroupOpen(!isGroupOpen);
  };

  /**
   * Set the layer visivbility on the map
   * @param {React.MouseEvent<HTMLButtonElement, MouseEvent>} e Mouse event
   */
  const handleToggleVisibility = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    e.stopPropagation();
    setOrToggleLayerVisibility(layer.layerPath);
  };

  /**
   * Set the highlight feature on the map for a layer
   * @param {React.MouseEvent<HTMLButtonElement, MouseEvent>} e Mouse event
   */
  const handleHighlightLayer = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    e.stopPropagation();
    setHighlightLayer(layer.layerPath);
  };

  /**
   * Set the zoom on the map based on the layer path
   * @param {React.MouseEvent<HTMLButtonElement, MouseEvent>} e Mouse event
   */
  const handleZoomTo = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    e.stopPropagation();
    zoomToLayerExtent(layer.layerPath);
  };

  const visibility = !getVisibilityFromOrderedLayerInfo(layer.layerPath);
  const isLayerVisible = layer.controls?.visibility ?? false;

  const getSecondaryText = (): JSX.Element => {
    if (getLayerChildren().length) {
      return <Typography component="p">{t('legend.subLayersCount').replace('{count}', getLayerChildren().length.toString())}</Typography>;
    }
    if (layer.items.length) {
      let itemsCountStr = '';
      if (layer.items.length > 1) {
        itemsCountStr = t('legend.itemsCount')
          .replace('{count}', layer.items.length.toString())
          .replace('{totalCount}', layer.items.length.toString());
      }

      return (
        <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
          <Typography component="span" fontSize={14}>
            {itemsCountStr}
          </Typography>
          <IconButton
            edge="end"
            tooltip="layers.visibilityIsAlways"
            className="buttonOutline"
            onClick={(e) => handleToggleVisibility(e)}
            disabled={!isLayerVisible}
          >
            {visibility ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
          </IconButton>
          <IconButton
            tooltip="legend.highlightLayer"
            sx={{ marginTop: '-0.3125rem' }}
            className="buttonOutline"
            onClick={(e) => handleHighlightLayer(e)}
          >
            {highlightedLayer === layer.layerPath ? <HighlightIcon /> : <HighlightOutlinedIcon />}
          </IconButton>
          <IconButton tooltip="legend.zoomTo" className="buttonOutline" onClick={(e) => handleZoomTo(e)}>
            <ZoomInSearchIcon />
          </IconButton>
        </Stack>
      );
    }

    return <Box />;
  };

  // renders the layers children, if any
  function renderChildren(): JSX.Element | null {
    if (!layer.children?.length) {
      return null;
    }

    return (
      <List sx={{ width: '100%', padding: '20px', margin: '20px 0px' }}>
        {layer.children
          .filter((d) => !['error', 'processing'].includes(d.layerStatus ?? ''))
          .map((item) => (
            <LegendLayer layer={item} key={item.layerPath} />
          ))}
      </List>
    );
  }

  // renders the layers items if any
  function renderItems(): JSX.Element | null {
    if (!layer.items?.length) {
      return null;
    }
    return (
      <List sx={sxClasses.subList}>
        {layer.items.map((item) => (
          <ListItem key={`${item.icon}/${item.name}`} className={!item.isVisible ? 'unchecked' : ''}>
            <ListItemIcon>{item.icon ? <Box component="img" alt={item.name} src={item.icon} /> : <BrowserNotSupportedIcon />}</ListItemIcon>
            <Tooltip title={item.name} placement="top" enterDelay={1000}>
              <ListItemText primary={item.name} />
            </Tooltip>
          </ListItem>
        ))}
      </List>
    );
  }

  function renderCollapsible(): JSX.Element | null {
    // show sub items only when number of items are more than 1.
    if (!(layer.children?.length > 1 || layer.items?.length > 1)) {
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
    <Box sx={sxClasses.legendLayerListItem}>
      <ListItem key={layer.layerName} divider onClick={handleExpandGroupClick}>
        <LayerIcon layer={layer} />
        <>
          <Tooltip title={layer.layerName} placement="top">
            <ListItemText
              sx={{
                '&:hover': {
                  cursor: 'pointer',
                },
              }}
              primary={layer.layerName}
              className="layerTitle"
              disableTypography
              secondary={getSecondaryText()}
            />
          </Tooltip>
          {!!(layer.children?.length > 1 || layer.items?.length > 1) && (
            <IconButton sx={{ marginBottom: '20px' }} className="buttonOutline" edge="end" size="small" tooltip="layers.toggleCollapse">
              {isGroupOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </>
      </ListItem>

      {renderCollapsible()}
    </Box>
  );
}
