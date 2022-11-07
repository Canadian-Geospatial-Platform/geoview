import MaterialListItem from '@mui/material/ListItem';

import { ListItemProps } from '@mui/material';

/**
 * Create a customized Material UI List Item
 *
 * @param {ListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItem(props: ListItemProps): JSX.Element {
  const { children, className, style } = props;

  return (
    <MaterialListItem sx={{ color: 'text.primary' }} className={`${className || ''}`} style={style || undefined}>
      {children !== undefined && children}
    </MaterialListItem>
  );
}
