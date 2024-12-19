import { useTheme } from '@mui/material';
import { memo, useMemo } from 'react';
import { Box, Collapse, List } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './legend-styles';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { ItemsList } from './legend-layer-items';
import { logger } from '@/core/utils/logger';

// Define component types and interfaces
type LegendLayerType = React.FC<{ layer: TypeLegendLayer }>;

interface CollapsibleContentProps {
  layer: TypeLegendLayer;
  legendExpanded: boolean; // Expanded come from store ordered layer info array
  initLightBox: (imgSrc: string, title: string, index: number, total: number) => void;
  LegendLayerComponent: LegendLayerType;
}

interface WMSLegendImageProps {
  imgSrc: string;
  initLightBox: (imgSrc: string, title: string, index: number, total: number) => void;
  legendExpanded: boolean;
  sxClasses: Record<string, object>;
}

// Constant style outside of render
const styles = {
  wmsImage: {
    maxWidth: '90%',
    cursor: 'pointer',
  },
} as const;

// Extracted WMS Legend Component
const WMSLegendImage = memo(
  ({ imgSrc, initLightBox, legendExpanded, sxClasses }: WMSLegendImageProps): JSX.Element => (
    <Collapse in={legendExpanded} sx={sxClasses!.collapsibleContainer} timeout="auto">
      <Box
        component="img"
        tabIndex={0}
        src={imgSrc}
        sx={styles.wmsImage}
        onClick={() => initLightBox(imgSrc, '', 0, 2)}
        onKeyDown={(e) => (e.code === 'Space' || e.code === 'Enter' ? initLightBox(imgSrc, '', 0, 2) : null)}
      />
    </Collapse>
  )
);
WMSLegendImage.displayName = 'WMSLegendImage';

export const CollapsibleContent = memo(function CollapsibleContent({
  layer,
  legendExpanded,
  initLightBox,
  LegendLayerComponent,
}: CollapsibleContentProps): JSX.Element | null {
  logger.logTraceRender('components/legend/legend-layer-container');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Props extraction
  const { children, items } = layer;

  // Early returns
  if (children?.length === 0 && items?.length === 1) return null;

  const isWMSWithLegend = layer.type === CV_CONST_LAYER_TYPES.WMS && layer.icons?.[0]?.iconImage && layer.icons[0].iconImage !== 'no data';

  // If it is a WMS legend, create a specific component
  if (isWMSWithLegend) {
    return (
      <WMSLegendImage
        imgSrc={layer.icons[0].iconImage || ''}
        initLightBox={initLightBox}
        legendExpanded={legendExpanded}
        sxClasses={sxClasses}
      />
    );
  }

  return (
    <Collapse in={legendExpanded} sx={sxClasses.collapsibleContainer} timeout="auto">
      <List>
        {layer.children
          .filter((d) => !['error', 'processing'].includes(d.layerStatus ?? ''))
          .map((item) => (
            <LegendLayerComponent layer={item} key={item.layerPath} />
          ))}
      </List>
      <ItemsList items={items} />
    </Collapse>
  );
});
