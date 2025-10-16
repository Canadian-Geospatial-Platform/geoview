import { useTranslation } from 'react-i18next';
import { Tooltip, useTheme } from '@mui/material';
import { memo, useCallback, useMemo } from 'react';
import { Box, ListItem, ListItemText, ListItemIcon, List, BrowserNotSupportedIcon } from '@/ui';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { useLayerSelectorLayerValue, useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import type { TypeLayerControls } from '@/api/types/layer-schema-types';
import { useMapSelectorIsLayerHiddenOnMap } from '@/core/stores/store-interface-and-intial-values/map-state';

interface ItemsListProps {
  items: TypeLegendItem[];
  layerPath: string;
}

// Extracted ListItem Component
// Apply style to increase left/right tooltip area (padding: '0 18px 0 18px', margin: '0 -18px 0 -18px')
const LegendListItem = memo(
  ({
    item: { icon, name, isVisible },
    layerVisible,
    showVisibilityTooltip: { show, value },
    showNameTooltip,
  }: {
    item: TypeLegendItem;
    layerVisible: boolean;
    showVisibilityTooltip: { show: boolean; value: string };
    showNameTooltip: boolean;
  }): JSX.Element => (
    <ListItem className={!isVisible || !layerVisible ? 'unchecked' : 'checked'}>
      <ListItemIcon>
        <Tooltip title={show ? value : ''} key={`Tooltip-${name}-${icon}1`} placement="left" disableHoverListener={!show}>
          <Box sx={{ padding: '0 18px 0 18px', margin: '0 -18px 0 -18px' }}>
            {icon ? <Box component="img" alt={name} src={icon} /> : <BrowserNotSupportedIcon />}
          </Box>
        </Tooltip>
      </ListItemIcon>
      <Tooltip title={showNameTooltip ? name : ''} key={`Tooltip-${name}-${icon}2`} placement="top" disableHoverListener={!showNameTooltip}>
        <ListItemText primary={name} />
      </Tooltip>
    </ListItem>
  )
);
LegendListItem.displayName = 'LegendListItem';

// Length at which the tooltip should be shown
const CONST_NAME_LENGTH_TOOLTIP = 30;

// Item list component (no memo to force re render from layers panel modifications)
export const ItemsList = memo(function ItemsList({ items, layerPath }: ItemsListProps): JSX.Element | null {
  logger.logTraceRender('components/legend/legend-layer-items');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();

  const { toggleItemVisibility, getLayer } = useLayerStoreActions();
  const layerControls = useLayerSelectorLayerValue<TypeLayerControls>(layerPath, 'controls');
  const layerHidden = useMapSelectorIsLayerHiddenOnMap(layerPath);
  const canToggleItemVisibility = getLayer(layerPath)?.canToggle && layerControls?.visibility !== false;

  /**
   * Handles toggling of class visibility when the legend item is clicked.
   * @param {TypeLegendItem} item - the item to change the visibility of
   */
  const handleToggleItemVisibility = useCallback(
    (item: TypeLegendItem): void => {
      toggleItemVisibility(layerPath, item);
    },
    [layerPath, toggleItemVisibility]
  );

  // Early returns
  if (!items?.length) return null;

  // Direct mapping since we only reach this code if items has content
  // GV isVisible is part of key so that it forces a re-render when it changes
  // GV this is specifically because of esriFeature layers
  // TODO Add a visibility hook for the individual classes to update this in the future
  return (
    <List sx={sxClasses.subList}>
      {items.map((item) => {
        // Common properties for the legend list item
        const commonProps = {
          item,
          layerVisible: !layerHidden,
          showVisibilityTooltip: {
            show: Boolean(canToggleItemVisibility && !layerHidden),
            value: t('layers.toggleItemVisibility'),
          },
          showNameTooltip: item.name.length > CONST_NAME_LENGTH_TOOLTIP,
        };

        // If classes can be toggled, wrap the component in a Box to handle click events
        const listItem = <LegendListItem key={`${item.name}-${item.isVisible}-${item.icon}`} {...commonProps} />;
        return canToggleItemVisibility && !layerHidden ? (
          <Box key={`Box-${item.name}-${item.icon}`} onClick={() => handleToggleItemVisibility(item)} sx={sxClasses.toggleableItem}>
            {listItem}
          </Box>
        ) : (
          listItem
        );
      })}
    </List>
  );
});
