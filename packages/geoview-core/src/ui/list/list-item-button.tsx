import { forwardRef, type Ref } from 'react';
import type { ListItemButtonProps } from '@mui/material';
import { ListItemButton as MaterialListItemButton } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI ListItemButton component for clickable list items.
 *
 * Wraps Material-UI's ListItemButton to provide interactive list item button
 * with built-in click handling and hover effects. Maintains full compatibility
 * with Material-UI ListItemButton props. Best used within List with ListItem,
 * ListItemIcon, and ListItemText components.
 *
 * @param props - ListItemButton configuration (see MUI docs for all available props)
 * @param ref - Reference to the underlying HTML element
 * @returns ListItemButton component for clickable list items
 */
function ListItemButtonUI(props: ListItemButtonProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/list/list-item-button', props);

  // Get constant from props
  const { children, className, style } = props;

  return (
    <MaterialListItemButton ref={ref} className={className || ''} style={style || undefined} {...props}>
      {children !== undefined && children}
    </MaterialListItemButton>
  );
}

// Export the ListItemButton using forwardRef so that passing ref is permitted and functional
export const ListItemButton = forwardRef<HTMLDivElement, ListItemButtonProps>(ListItemButtonUI);
