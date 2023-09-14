import { AppBar as MaterialAppBar, AppBarProps } from '@mui/material';

/**
 * Create a appbar component
 *
 * @param {AppBarProps} props appbar properties
 * @returns {JSX.Element} returns appbar component
 */
export function AppBar(props: AppBarProps): JSX.Element {
  return <MaterialAppBar {...props} />;
}
