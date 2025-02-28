import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { Box, ListItem, Tooltip, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon } from '@/ui';
import {
  useMapStoreActions,
  useSelectorLayerLegendCollapsed,
  useSelectorLayerInVisibleRange,
  useSelectorLayerName,
  useSelectorLayerItems,
} from '@/core/stores/';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { SecondaryControls } from './legend-layer-ctrl';
import { CollapsibleContent } from './legend-layer-container';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';

interface LegendLayerProps {
  layerPath: string;
}

interface LegendLayerHeaderProps {
  layerPath: string;
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
const LegendLayerHeader = memo(({ layerPath, tooltip, onExpandClick }: LegendLayerHeaderProps): JSX.Element => {
  // Log
  logger.logTraceUseMemo('components/legend/legend-layer - LegendLayerHeader', layerPath);

  // Hooks
  const layerName = useSelectorLayerName(layerPath);
  const layerItems = useSelectorLayerItems(layerPath);
  const layerChildren = useSelectorLayerItems(layerPath);
  const isCollapsed = useSelectorLayerLegendCollapsed(layerPath);
  const inVisibleRange = useSelectorLayerInVisibleRange(layerPath);

  // Return the ui
  return (
    <ListItem key={layerPath} divider onClick={onExpandClick} className={!inVisibleRange ? 'outOfRange' : ''}>
      <LayerIcon layerPath={layerPath} />
      <Tooltip title={layerName} placement="top">
        <ListItemText
          sx={styles.listItemText}
          primary={layerName}
          className="layerTitle"
          disableTypography
          secondary={<SecondaryControls layerPath={layerPath} />}
        />
      </Tooltip>
      {((layerChildren && layerChildren.length >= 1) || (layerItems && layerItems.length >= 1)) && (
        <IconButton className="buttonOutline" edge="end" size="small" tooltip={tooltip}>
          {!isCollapsed ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      )}
    </ListItem>
  );
});

LegendLayerHeader.displayName = 'LegendLayerHeader';

// Main LegendLayer component
export function LegendLayer({ layerPath }: LegendLayerProps): JSX.Element {
  // Log
  logger.logTraceRender('components/legend/legend-layer', layerPath);

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Stores
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { setLegendCollapsed } = useMapStoreActions();

  const handleExpandGroupClick = useCallback(
    (event: React.MouseEvent): void => {
      // Log
      logger.logTraceUseCallback('LEGEND-LAYER - handleExpandGroupClick', layerPath);

      event.stopPropagation();
      setLegendCollapsed(layerPath); // store value
    },
    [layerPath, setLegendCollapsed]
  );

  return (
    <>
      <Box sx={sxClasses.legendLayerListItem}>
        <LegendLayerHeader layerPath={layerPath} tooltip={t('layers.toggleCollapse')} onExpandClick={handleExpandGroupClick} />
        <CollapsibleContent layerPath={layerPath} initLightBox={initLightBox} LegendLayerComponent={LegendLayer} />
      </Box>
      <LightBoxComponent />
    </>
  );
}
