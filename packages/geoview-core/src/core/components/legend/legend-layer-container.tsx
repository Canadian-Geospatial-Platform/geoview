import { useTheme } from '@mui/material';
import { memo } from 'react';
import { Box, Collapse, List } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { ItemsList } from './legend-layer-items';

// Define component types and interfaces
type LegendLayerType = React.FC<{ layer: TypeLegendLayer }>;

interface CollapsibleContentProps {
  layer: TypeLegendLayer;
  legendExpanded: boolean;
  initLightBox: (imgSrc: string, title: string, index: number, total: number) => void;
  childLayers: TypeLegendLayer[];
  items: TypeLegendLayer['items'];
  LegendLayerComponent: LegendLayerType;
}

// CollapsibleContent component moved after LegendLayer
export const CollapsibleContent = memo(function CollapsibleContent({
  layer,
  legendExpanded,
  initLightBox,
  childLayers,
  items,
  LegendLayerComponent,
}: CollapsibleContentProps) {
  logger.logDebug('legend1 collapsible', layer, childLayers, items);
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // If it is a WMS and there is a legend image, add it with the lightbox handlers
  if (layer.type === CV_CONST_LAYER_TYPES.WMS && layer.icons.length && layer.icons[0].iconImage && layer.icons[0].iconImage !== 'no data') {
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

  // If there is only one item or no childlayer, do not create the component
  if (childLayers?.length === 0 && items?.length === 1) {
    return null;
  }

  if (layer.children?.length > 0) layer.children.every((item) => logger.logDebug('TTT item', item.layerPath));

  // Render list of items (layer class) or there is a child layer so render a new legend-layer component
  return (
    <Collapse in={legendExpanded} sx={sxClasses.collapsibleContainer} timeout="auto">
      {layer.children?.length > 0 && (
        <List sx={{ width: '100%', padding: '20px', margin: '20px 0px' }}>
          {layer.children
            .filter((d) => !['error', 'processing'].includes(d.layerStatus ?? ''))
            .map((item) => (
              <LegendLayerComponent layer={item} key={item.layerPath} />
            ))}
        </List>
      )}
      <ItemsList items={items} />
    </Collapse>
  );
});
