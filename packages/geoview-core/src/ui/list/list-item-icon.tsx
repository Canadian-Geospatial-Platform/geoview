import { ListItemIcon as MaterialListItemIcon, ListItemIconProps } from '@mui/material';

/**
 * Create a customized Material UI List Item
 *
 * @param {ListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItemIcon(props: ListItemIconProps): JSX.Element {
  const { children, className, style } = props;

  return (
    <MaterialListItemIcon className={className || ''} style={style || undefined}>
      {children !== undefined && children}
    </MaterialListItemIcon>
  );
}
