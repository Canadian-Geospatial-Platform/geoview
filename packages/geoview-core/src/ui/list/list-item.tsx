import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { ListItemProps } from '@mui/material';
import { ListItem as MaterialListItem } from '@mui/material';
import { logger } from '@/core/utils/logger';

const sxClasses = {
  listItem: {
    color: 'text.primary',
    padding: 0,
  },
};

/**
 * Material-UI ListItem component for list content containers.
 *
 * Wraps Material-UI's ListItem to provide content container within lists.
 * Maintains full compatibility with Material-UI ListItem props. Use with
 * ListItemButton, ListItemIcon, and ListItemText for complete list item layouts.
 *
 * @param props - ListItem configuration (see MUI docs for all available props)
 * @param ref - Reference to the underlying li element
 * @returns ListItem component for list item content
 */
function ListItemUI(props: ListItemProps, ref: Ref<HTMLLIElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/list/list-item', props);

  // Get constant from props
  const { children } = props;

  return (
    <MaterialListItem sx={sxClasses.listItem} {...props} ref={ref}>
      {children !== undefined && children}
    </MaterialListItem>
  );
}

// Export the List Item using forwardRef so that passing ref is permitted and functional in the react standards
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(ListItemUI);
