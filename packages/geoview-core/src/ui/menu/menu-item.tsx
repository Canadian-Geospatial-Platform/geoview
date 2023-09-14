import { MenuItem as MaterialMenuItem, MenuItemProps } from '@mui/material';

/**
 * Create a customized Material UI MenuItem
 *
 * @param {MenuProps} props the properties passed to the MenuItem element
 * @returns {JSX.Element} the created MenuItem element
 */
export function MenuItem(props: MenuItemProps): JSX.Element {
  const { children } = props;

  return <MaterialMenuItem {...props}>{children !== undefined && children}</MaterialMenuItem>;
}
