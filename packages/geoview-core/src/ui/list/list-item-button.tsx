import MaterialListItemButton from '@mui/material/ListItemButton';
import { ListItemButtonProps } from '@mui/material';

/**
 * Create a customized Material UI List Item
 *
 * @param {ListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItemButton(props: ListItemButtonProps): JSX.Element {
  const { children, className, style } = props;

  return (
    <MaterialListItemButton className={className || ''} style={style || undefined}>
      {children !== undefined && children}
    </MaterialListItemButton>
  );
}
