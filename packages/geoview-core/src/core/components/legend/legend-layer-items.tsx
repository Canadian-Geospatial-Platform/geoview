import { useTheme } from '@mui/material';
import { memo, useMemo } from 'react';
import { Box, ListItem, ListItemText, ListItemIcon, List, BrowserNotSupportedIcon } from '@/ui';
import { TypeLegendItem } from '@/core/components/layers/types';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';

interface ItemsListProps {
  items: TypeLegendItem[];
}

// Extracted ListItem Component
const LegendListItem = memo(
  ({ item }: { item: TypeLegendItem }): JSX.Element => (
    <ListItem key={`${item.icon}-${item.name}`} className={!item.isVisible ? 'unchecked' : 'checked'}>
      <ListItemIcon>{item.icon ? <Box component="img" alt={item.name} src={item.icon} /> : <BrowserNotSupportedIcon />}</ListItemIcon>
      <ListItemText primary={item.name} />
    </ListItem>
  )
);
LegendListItem.displayName = 'LegendListItem';

// Item list component (no memo to force re render from layers panel modifications)
export const ItemsList = memo(function ItemsList({ items }: ItemsListProps): JSX.Element | null {
  logger.logTraceRender('components/legend/legend-layer-items');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Early returns
  if (!items?.length) return null;

  // Filter only visible items
  const visibleItems = items.filter((item) => item.isVisible);

  // Direct mapping since we only reach this code if items has content
  return (
    <List sx={sxClasses.subList}>
      {visibleItems.map((item) => (
        <LegendListItem item={item} key={`${item.icon}-${item.name}`} />
      ))}
    </List>
  );
});
