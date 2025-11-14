import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material';
import { Box, ListItem, Tooltip, ListItemText, IconButton, KeyboardArrowDownIcon, KeyboardArrowUpIcon, ProgressBar } from '@/ui';
import {
  useLayerSelectorChildren,
  useLayerSelectorItems,
  useLayerSelectorName,
  useLayerSelectorStatus,
  useLayerSelectorType,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useMapStoreActions,
  useMapSelectorLayerLegendCollapsed,
  useMapSelectorIsLayerHiddenOnMap,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { useLightBox } from '@/core/components/common';
import { LayerIcon } from '@/core/components/common/layer-icon';
import { SecondaryControls } from './legend-layer-ctrl';
import { CollapsibleContent } from './legend-layer-container';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';

// TODO: WCAG - Check all icon buttons for aria-label clarity and translations
// TODO: WCAG - Check all icon buttons for "state related" aria values (i.e aria-checked, aria-disabled, etc.)

interface LegendLayerProps {
  layerPath: string;
}

interface LegendLayerHeaderProps {
  layerPath: string;
  tooltip: string;
  onExpandClick: (event: React.MouseEvent) => void;
}

// Length at which the tooltip should be shown
const CONST_NAME_LENGTH_TOOLTIP = 50;

// Extracted Header Component
const LegendLayerHeader = memo(({ layerPath, tooltip, onExpandClick }: LegendLayerHeaderProps): JSX.Element => {
  // Log
  logger.logTraceUseMemo('components/legend/legend-layer - LegendLayerHeader', layerPath);

  // Hooks
  const isCollapsed = useMapSelectorLayerLegendCollapsed(layerPath);
  const layerHidden = useMapSelectorIsLayerHiddenOnMap(layerPath);
  const layerName = useLayerSelectorName(layerPath);
  const layerItems = useLayerSelectorItems(layerPath);
  const layerChildren = useLayerSelectorChildren(layerPath);
  const layerType = useLayerSelectorType(layerPath);
  const layerStatus = useLayerSelectorStatus(layerPath);

  // This is used to determine if the text should be wrapped in a tooltip
  const shouldShowTooltip = !!layerName && layerName.length > CONST_NAME_LENGTH_TOOLTIP;

  // Return the ui
  return (
    <ListItem key={layerPath} divider className={layerHidden || layerStatus === 'error' ? 'outOfRange' : ''}>
      <LayerIcon layerPath={layerPath} />
      <ListItemText
        primary={
          <Tooltip title={layerName} placement="top" disableHoverListener={!shouldShowTooltip}>
            <Box>{layerName}</Box>
          </Tooltip>
        }
        className="layerTitle"
        disableTypography
        secondary={<SecondaryControls layerPath={layerPath} />}
      />
      {((layerChildren && layerChildren.length > 0) || (layerItems && layerItems.length > 1) || layerType === CONST_LAYER_TYPES.WMS) && (
        <IconButton className="buttonOutline" onClick={onExpandClick} edge="end" size="small" aria-label={tooltip} tooltip={tooltip}>
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
