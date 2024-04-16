import { ListItem as MaterialListItem, ListItemProps } from '@mui/material';
import React from 'react';

const sxClasses = {
  listItem: {
    color: 'text.primary',
    padding: 0,
  },
};

/**
 * Create a customized Material UI List Item
 *
 * @param {TypeListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>((props, ref) => {
  const { children } = props;

  return (
    <MaterialListItem sx={sxClasses.listItem} {...props} ref={ref}>
      {children !== undefined && children}
    </MaterialListItem>
  );
});

ListItem.displayName = 'ListItem';
