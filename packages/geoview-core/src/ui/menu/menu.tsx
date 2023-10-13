import { Menu as MaterialMenu, MenuProps } from '@mui/material';

/**
 * Create a customized Material UI Menu
 *
 * @param {MenuProps} props the properties passed to the Menu element
 * @returns {JSX.Element} the created Menu element
 */
export function Menu(props: MenuProps): JSX.Element {
  const { children } = props;

  return <MaterialMenu {...props}>{children !== undefined && children}</MaterialMenu>;
}
