import { useTranslation } from 'react-i18next';
import { Tooltip, useTheme } from '@mui/material';
import { memo, useCallback, useMemo } from 'react';
import { Box, ListItem, ListItemText, ListItemIcon, List, BrowserNotSupportedIcon } from '@/ui';
import { TypeLegendItem } from '@/core/components/layers/types';
import { useLayerStoreActions, useSelectorLayerControls } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';
import { TypeLayerControls } from '@/api/config/types/map-schema-types';

interface ItemsListProps {
  items: TypeLegendItem[];
  layerPath: string;
}

// Extracted ListItem Component
const LegendListItem = memo(
  ({ item: { icon, name, isVisible } }: { item: TypeLegendItem }): JSX.Element => (
    <ListItem className={!isVisible ? 'unchecked' : 'checked'}>
      <ListItemIcon>{icon ? <Box component="img" alt={name} src={icon} /> : <BrowserNotSupportedIcon />}</ListItemIcon>
      <ListItemText primary={name} />
    </ListItem>
  )
);
LegendListItem.displayName = 'LegendListItem';

// Item list component (no memo to force re render from layers panel modifications)
export const ItemsList = memo(function ItemsList({ items, layerPath }: ItemsListProps): JSX.Element | null {
  logger.logTraceRender('components/legend/legend-layer-items');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const { t } = useTranslation<string>();

  const { toggleItemVisibility, getLayer } = useLayerStoreActions();
  const layerControls: TypeLayerControls | undefined = useSelectorLayerControls(layerPath);
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
        if (!canToggleItemVisibility)
          return (
            <Tooltip title={item.name} key={`Tooltip-${item.name}-${item.icon}`} placement="top">
              <LegendListItem item={item} key={`${item.name}-${item.isVisible}-${item.icon}`} />
            </Tooltip>
          );

        return (
          <Tooltip
            title={
              <div>
                {t('layers.toggleItemVisibility')}
                <br />
                {item.name}
              </div>
            }
            key={`Tooltip-${item.name}-${item.icon}`}
            placement="top"
            sx={sxClasses.toggleableItem}
          >
            <Box key={`Box-${item.name}-${item.icon}`} onClick={() => handleToggleItemVisibility(item)}>
              <LegendListItem item={item} key={`${item.name}-${item.isVisible}-${item.icon}`} />
            </Box>
          </Tooltip>
        );
      })}
    </List>
  );
});
