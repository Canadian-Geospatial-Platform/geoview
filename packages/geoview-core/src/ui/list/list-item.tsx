import React, { forwardRef, Ref } from 'react';
import { ListItem as MaterialListItem, ListItemProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

const sxClasses = {
  listItem: {
    color: 'text.primary',
    padding: 0,
  },
};

/**
 * Create a customized Material UI List Item component.
 * This is a simple wrapper around MaterialListItem that maintains
 * full compatibility with Material-UI's List Item props.
 *
 * @param {ListItemProps} props - All valid Material-UI List Item props
 * @param {Ref<HTMLLIElement>} ref - Reference to the underlying li element
 * @returns {JSX.Element} The List Item component
 */
function ListItemUI(props: ListItemProps, ref: Ref<HTMLLIElement>): JSX.Element {
  logger.logTraceRender('ui/list/list-item', props);

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
