import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { Box, ListItem, Tooltip, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon, ProgressBar } from '@/ui';
import {
  useSelectorLayerName,
  useSelectorLayerItems,
  useSelectorLayerChildren,
  useSelectorLayerType,
  useSelectorLayerStatus,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useMapStoreActions,
  useSelectorLayerLegendCollapsed,
  useSelectorLayerInVisibleRange,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { SecondaryControls } from './legend-layer-ctrl';
import { CollapsibleContent } from './legend-layer-container';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { TypeLayerStatus } from '@/api/config/types/map-schema-types';

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
  // Hooks
  const layerName = useSelectorLayerName(layerPath);
  const layerItems = useSelectorLayerItems(layerPath);
  const layerChildren = useSelectorLayerChildren(layerPath);
  const isCollapsed = useSelectorLayerLegendCollapsed(layerPath);
  const inVisibleRange = useSelectorLayerInVisibleRange(layerPath);
  const layerType = useSelectorLayerType(layerPath);
  const layerStatus: TypeLayerStatus | undefined = useSelectorLayerStatus(layerPath);

  // Log
  logger.logTraceUseMemo('components/legend/legend-layer - LegendLayerHeader', layerPath, isCollapsed);

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
      {((layerChildren && layerChildren.length > 1) || (layerItems && layerItems.length > 1) || layerType === CV_CONST_LAYER_TYPES.WMS) && (
        <IconButton className="buttonOutline" edge="end" size="small" tooltip={tooltip}>
          {!isCollapsed ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      )}
      {layerStatus === 'loading' && (
        <Box
          sx={{
            position: 'absolute !important',
            display: 'block !important',
            bottom: '0',
            width: '100%',
            height: 'auto !important',
            span: { height: '2px' },
          }}
        >
          <ProgressBar />
        </Box>
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
  const { toggleLegendCollapsed } = useMapStoreActions();

  const handleExpandGroupClick = useCallback(
    (event: React.MouseEvent): void => {
      // Log
      logger.logTraceUseCallback('LEGEND-LAYER - handleExpandGroupClick', layerPath);

      event.stopPropagation();
      toggleLegendCollapsed(layerPath); // store value
    },
    [layerPath, toggleLegendCollapsed]
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
