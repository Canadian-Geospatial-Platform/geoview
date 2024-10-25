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
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { useLightBox } from '@/core/components/common';

interface LegendLayerProps {
  layer: TypeLegendLayer;
}

export function LegendLayer({ layer }: LegendLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/legend/legend-layer');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const { initLightBox, LightBoxComponent } = useLightBox();

  // Get store actions
  const highlightedLayer = useLayerHighlightedLayer();
  const { getVisibilityFromOrderedLayerInfo, setOrToggleLayerVisibility, getLegendCollapsedFromOrderedLayerInfo, setLegendCollapsed } =
    useMapStoreActions();
  const { setHighlightLayer, zoomToLayerExtent } = useLayerStoreActions();

  const getLayerChildren = (): TypeLegendLayer[] => {
    return layer.children?.filter((c) => ['processed', 'loaded'].includes(c.layerStatus ?? ''));
  };

  /**
   * Handle expand/shrink of layer groups.
   */
  const handleExpandGroupClick = (): void => {
    setLegendCollapsed(layer.layerPath);
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
    zoomToLayerExtent(layer.layerPath).catch((error) => {
      // Log
      logger.logPromiseFailed('in zoomToLayerExtent in legend-layer.handleZoomTo', error);
    });
  };

  const legendExpanded = !getLegendCollapsedFromOrderedLayerInfo(layer.layerPath);

  const visibility = !getVisibilityFromOrderedLayerInfo(layer.layerPath);
  const isLayerVisible = layer.controls?.visibility ?? false;

  const getSecondaryText = (): JSX.Element => {
    // dnt show icons when layer status is not loaded
    if (!['processed', 'loaded'].includes(layer.layerStatus ?? '')) {
      return <Box />;
    }
    let subTitle = '';
    if (getLayerChildren().length) {
      subTitle = t('legend.subLayersCount').replace('{count}', getLayerChildren().length.toString());
    } else if (layer.items.length > 1) {
      subTitle = t('legend.itemsCount')
        .replace('{count}', layer.items.length.toString())
        .replace('{totalCount}', layer.items.length.toString());
    }
    return (
      <Stack direction="row" alignItems="center" sx={sxClasses.layerStackIcons}>
        {!!subTitle.length && <Typography fontSize={14}>{subTitle}</Typography>}
        <Box>
          <IconButton
            edge="end"
            tooltip="layers.toggleVisibility"
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
        </Box>
      </Stack>
    );
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
          <ListItem key={`${item.icon}/${item.name}/${layer.items.indexOf(item)}`} className={!item.isVisible ? 'unchecked' : 'checked'}>
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
    if (
      layer.type === CV_CONST_LAYER_TYPES.WMS &&
      layer.icons.length &&
      layer.icons[0].iconImage &&
      layer.icons[0].iconImage !== 'no data'
    ) {
      const imgSrc = layer.icons[0].iconImage;
      return (
        <Collapse in={legendExpanded} sx={sxClasses.collapsibleContainer} timeout="auto">
          <Box
            component="img"
            tabIndex={0}
            src={imgSrc}
            sx={{ maxWidth: '100%', cursor: 'pointer' }}
            onClick={() => initLightBox(imgSrc, '', 0, 2)}
            onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter' ? initLightBox(imgSrc, '', 0, 2) : null)}
          />
        </Collapse>
      );
    }

    // show sub items only when number of items are more than 1.
    if (!(layer.children?.length > 1 || layer.items?.length > 1)) {
      return null;
    }

    return (
      <Collapse in={legendExpanded} sx={sxClasses.collapsibleContainer} timeout="auto">
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
              {legendExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </>
      </ListItem>

      {renderCollapsible()}
      <LightBoxComponent />
    </Box>
  );
}
