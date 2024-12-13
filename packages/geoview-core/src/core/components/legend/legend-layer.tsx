import { memo, useCallback, useMemo, useState } from 'react';
import { ListItem, Tooltip, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useMapStoreActions } from '@/core/stores/';
import { logger } from '@/core/utils/logger';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '../common/layer-icon';
import { SecondaryControls } from './legend-layer-ctrl';
import { CollapsibleContent } from './legend-layer-container';

// Define component types and interfaces
type LegendLayerType = React.FC<{ layer: TypeLegendLayer }>;

interface LegendLayerProps {
  layer: TypeLegendLayer;
}

// Main LegendLayer component
export const LegendLayer: LegendLayerType = memo(function LegendLayer({ layer }: LegendLayerProps) {
  // Hooks
  logger.logDebug('legend1 LegendLayerType', layer);

  // const { t } = useTranslation();
  // const theme = useTheme();
  // const sxClasses = getSxClasses(theme);

  // Stores
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { getLegendCollapsedFromOrderedLayerInfo, setLegendCollapsed } = useMapStoreActions();

  // Memoized values
  const layerChildren = useMemo(
    () => layer.children?.filter((c) => ['processed', 'loaded'].includes(c.layerStatus ?? '')) ?? [],
    [layer.children]
  );

  const [legendExpanded, setLegendExpanded] = useState(getLegendCollapsedFromOrderedLayerInfo(layer.layerPath));

  const handleExpandGroupClick = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      setLegendCollapsed(layer.layerPath);
      setLegendExpanded(getLegendCollapsedFromOrderedLayerInfo(layer.layerPath));
    },
    [layer.layerPath, setLegendCollapsed]
  );

  return (
    <>
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
              secondary={
                <SecondaryControls
                  layer={layer}
                  layerStatus={layer.layerStatus || 'error'}
                  itemsLength={layer.items ? layer.items.length : 0}
                  childLayers={layerChildren}
                />
              }
            />
          </Tooltip>
          {!!(layer.children?.length > 1 || layer.items?.length > 1) && (
            <IconButton sx={{ marginBottom: '20px' }} className="buttonOutline" edge="end" size="small" tooltip="layers.toggleCollapse">
              {legendExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
        </>
      </ListItem>
      <CollapsibleContent
        layer={layer}
        legendExpanded={legendExpanded}
        initLightBox={initLightBox}
        childLayers={layerChildren}
        items={layer.items}
        LegendLayerComponent={LegendLayer}
      />
      {LightBoxComponent}
    </>
  );
});

export default LegendLayer;
