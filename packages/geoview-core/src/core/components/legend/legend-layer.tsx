import { memo, useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { Box, ListItem, Tooltip, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { useLayerStoreActions, useMapStoreActions } from '@/core/stores/';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '../common/layer-icon';
import { SecondaryControls } from './legend-layer-ctrl';
import { CollapsibleContent } from './legend-layer-container';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';

interface LegendLayerProps {
  layer: TypeLegendLayer;
}

interface LegendLayerHeaderProps {
  layer: TypeLegendLayer;
  isCollapsed: boolean;
  isVisible: boolean;
  onExpandClick: (e: React.MouseEvent) => void;
}

// Constant style outside of render
const styles = {
  listItemText: {
    '&:hover': { cursor: 'pointer' },
  },
} as const;

// Extracted Header Component
const LegendLayerHeader = memo(
  ({ layer, isCollapsed, isVisible, onExpandClick }: LegendLayerHeaderProps): JSX.Element => (
    <ListItem key={layer.layerName} divider onClick={onExpandClick}>
      <LayerIcon layer={layer} />
      <Tooltip title={layer.layerName} placement="top">
        <ListItemText
          sx={styles.listItemText}
          primary={layer.layerName}
          className="layerTitle"
          disableTypography
          secondary={<SecondaryControls layer={layer} visibility={isVisible} />}
        />
      </Tooltip>
      {(layer.children?.length > 1 || layer.items?.length > 1) && (
        <IconButton className="buttonOutline" edge="end" size="small" tooltip="layers.toggleCollapse">
          {!isCollapsed ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      )}
    </ListItem>
  )
);
LegendLayerHeader.displayName = 'LegendLayerHeader';

// Main LegendLayer component
export function LegendLayer({ layer }: LegendLayerProps): JSX.Element {
  logger.logTraceRender('components/legend/legend-layer');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Stores
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { getLegendCollapsedFromOrderedLayerInfo, getVisibilityFromOrderedLayerInfo, setLegendCollapsed } = useMapStoreActions();
  const { getLayerStatus } = useLayerStoreActions();
  const isCollapsed = getLegendCollapsedFromOrderedLayerInfo(layer.layerPath);
  const isVisible = getVisibilityFromOrderedLayerInfo(layer.layerPath);
  const layerStatus = getLayerStatus(layer.layerPath);

  // Create a new layer object with updated status (no useMemo to ensure updates)
  const currentLayer = {
    ...layer,
    layerStatus,
    items: layer.items?.map((item) => ({
      ...item,
    })),
  };

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
        <LegendLayerHeader layer={currentLayer} isCollapsed={isCollapsed} isVisible={isVisible} onExpandClick={handleExpandGroupClick} />
        <CollapsibleContent
          layer={currentLayer}
          legendExpanded={!isCollapsed}
          initLightBox={initLightBox}
          LegendLayerComponent={LegendLayer}
        />
      </Box>
      <LightBoxComponent />
    </>
  );
}
