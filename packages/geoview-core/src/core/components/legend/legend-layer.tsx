import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { Box, ListItem, Tooltip, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import {
  useMapStoreActions,
  useSelectorLayerLegendCollapsed,
  useSelectorLayerStatus,
  useSelectorLayerVisibility,
  useSelectorLayerInVisibleRange,
} from '@/core/stores/';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '@/core/components/common/layer-icon';
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
  inVisibleRange: boolean;
  tooltip: string;
  onExpandClick: (event: React.MouseEvent) => void;
}

// Constant style outside of render
const styles = {
  listItemText: {
    '&:hover': { cursor: 'pointer' },
  },
} as const;

// Extracted Header Component
const LegendLayerHeader = memo(
  ({ layer, isCollapsed, isVisible, inVisibleRange, tooltip, onExpandClick }: LegendLayerHeaderProps): JSX.Element => (
    <ListItem key={layer.layerName} divider onClick={onExpandClick} className={!inVisibleRange ? 'outOfRange' : ''}>
      <LayerIcon layer={layer} />
      <Tooltip title={layer.layerName} placement="top">
        <ListItemText
          sx={styles.listItemText}
          primary={layer.layerName}
          className="layerTitle"
          disableTypography
          secondary={<SecondaryControls layer={layer} isVisible={isVisible} />}
        />
      </Tooltip>
      {(layer.children?.length > 1 || layer.items?.length > 1) && (
        <IconButton className="buttonOutline" edge="end" size="small" tooltip={tooltip}>
          {!isCollapsed ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      )}
    </ListItem>
  )
);
LegendLayerHeader.displayName = 'LegendLayerHeader';

// Main LegendLayer component
export function LegendLayer({ layer }: LegendLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/legend/legend-layer');

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Stores
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { setLegendCollapsed } = useMapStoreActions();
  const isVisible = useSelectorLayerVisibility(layer.layerPath);
  const isCollapsed = useSelectorLayerLegendCollapsed(layer.layerPath);
  const inVisibleRange = useSelectorLayerInVisibleRange(layer.layerPath);
  const layerStatus = useSelectorLayerStatus(layer.layerPath);

  // TODO: Check - Probably don't do that as it creates a new layer object and new items and new children, etc causing multiple re-renderings
  // Create a new layer object with updated status (no useMemo to ensure updates in inner child)
  const currentLayer = {
    ...layer,
    layerStatus,
    items: layer.items?.map((item) => ({
      ...item,
    })),
  };

  const handleExpandGroupClick = useCallback(
    (event: React.MouseEvent): void => {
      // Log
      logger.logTraceUseCallback('LEGEND-LAYER - handleExpandGroupClick', layer.layerPath);

      event.stopPropagation();
      setLegendCollapsed(layer.layerPath); // store value
    },
    [layer.layerPath, setLegendCollapsed]
  );

  return (
    <>
      <Box sx={sxClasses.legendLayerListItem}>
        <LegendLayerHeader
          layer={currentLayer}
          isCollapsed={isCollapsed}
          isVisible={isVisible}
          inVisibleRange={inVisibleRange}
          tooltip={t('layers.toggleCollapse') as string}
          onExpandClick={handleExpandGroupClick}
        />
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
