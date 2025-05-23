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
  ({ item: { icon, name, isVisible } }: { item: TypeLegendItem }): JSX.Element => (
    <ListItem className={!isVisible ? 'unchecked' : 'checked'}>
      <ListItemIcon>{icon ? <Box component="img" alt={name} src={icon} /> : <BrowserNotSupportedIcon />}</ListItemIcon>
      <ListItemText primary={name} />
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

  // Direct mapping since we only reach this code if items has content
  // GV isVisible is part of key so that it forces a re-render when it changes
  // GV this is specifically because of esriFeature layers
  return (
    <List sx={sxClasses.subList}>
      {items.map((item) => (
        <LegendListItem item={item} key={`${item.name}-${item.isVisible}-${item.icon}`} />
      ))}
    </List>
  );
});
