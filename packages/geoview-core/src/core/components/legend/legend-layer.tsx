import { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { Box, ListItem, Tooltip, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useLayerStoreActions, useMapStoreActions } from '@/core/stores/';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '../common/layer-icon';
import { SecondaryControls } from './legend-layer-ctrl';
import { CollapsibleContent } from './legend-layer-container';
import { getSxClasses } from './legend-styles';

interface LegendLayerProps {
  layer: TypeLegendLayer;
}

// Main LegendLayer component
export function LegendLayer({ layer }: LegendLayerProps): JSX.Element {
  // Hooks
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // Stores
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { getLegendCollapsedFromOrderedLayerInfo, getVisibilityFromOrderedLayerInfo, setLegendCollapsed } = useMapStoreActions();
  const { getLayerStatus } = useLayerStoreActions();

  // const [layerState, setLayerState] = useState(layer);
  const isCollapsed = getLegendCollapsedFromOrderedLayerInfo(layer.layerPath);
  const isVisible = getVisibilityFromOrderedLayerInfo(layer.layerPath);
  const layerStatus = getLayerStatus(layer.layerPath);

  // Create a new layer object with updated status (no useMemo to ensure updates)
  const currentLayer = { ...layer, layerStatus };

  // Memoized values
  const layerChildren = useMemo(
    () => currentLayer.children?.filter((c) => ['processed', 'loaded'].includes(c.layerStatus ?? '')) ?? [],
    [currentLayer.children]
  );

  const handleExpandGroupClick = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      setLegendCollapsed(layer.layerPath); // store value
    },
    [layer.layerPath, setLegendCollapsed]
  );

  return (
    <>
      <Box sx={sxClasses.legendLayerListItem}>
        <ListItem key={layer.layerName} divider onClick={handleExpandGroupClick}>
          <LayerIcon layer={currentLayer} />
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
                    layer={currentLayer}
                    layerStatus={layer.layerStatus || 'error'}
                    itemsLength={layer.items ? layer.items.length : 0}
                    childLayers={layerChildren}
                    visibility={isVisible}
                  />
                }
              />
            </Tooltip>
            {!!(layer.children?.length > 1 || layer.items?.length > 1) && (
              <IconButton sx={{ marginBottom: '20px' }} className="buttonOutline" edge="end" size="small" tooltip="layers.toggleCollapse">
                {!isCollapsed ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            )}
          </>
        </ListItem>
        <CollapsibleContent
          layer={currentLayer}
          legendExpanded={!isCollapsed}
          initLightBox={initLightBox}
          childLayers={layerChildren}
          items={layer.items}
          LegendLayerComponent={LegendLayer}
        />
      </Box>
      <LightBoxComponent />
    </>
  );
}

export default LegendLayer;
