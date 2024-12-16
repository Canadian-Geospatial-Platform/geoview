import { useTheme } from '@mui/material';
import { memo, useMemo } from 'react';
import { Box, ListItem, Tooltip, ListItemText, ListItemIcon, List, BrowserNotSupportedIcon } from '@/ui';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { getSxClasses } from './legend-styles';
import { logger } from '@/core/utils/logger';

interface ItemsListProps {
  items: TypeLegendLayer['items'];
}

// ItemsList component
export const ItemsList = memo(function ItemsList({ items }: ItemsListProps) {
  logger.logDebug('legend1 item list', items);

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  if (!items?.length) {
    return null;
  }

  // Direct mapping since we only reach this code if items has content
  const listItems = items.map((item) => (
    <ListItem key={`${item.icon}-${item.name}`} className={!item.isVisible ? 'unchecked' : 'checked'}>
      <ListItemIcon>{item.icon ? <Box component="img" alt={item.name} src={item.icon} /> : <BrowserNotSupportedIcon />}</ListItemIcon>
      <Tooltip title={item.name} placement="top" enterDelay={1000}>
        <ListItemText primary={item.name} />
      </Tooltip>
    </ListItem>
  ));

  return <List sx={sxClasses.subList}>{listItems}</List>;
});
