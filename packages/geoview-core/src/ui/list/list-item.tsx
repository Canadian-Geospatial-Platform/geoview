import MaterialListItem from '@mui/material/ListItem';

import { ListItemProps } from '@mui/material';

/**
 * Create a customized Material UI List Item
 *
 * @param {ListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItem(props: ListItemProps): JSX.Element {
  const { children } = props;

  return <MaterialListItem {...props}>{children !== undefined && children}</MaterialListItem>;
}
