import { Toolbar as MaterialToolbar, ToolbarProps } from '@mui/material';

/**
 * Create a toollbar component
 *
 * @param {ToolbarProps} props toollbar properties
 * @returns {JSX.Element} returns toollbar component
 */
export function Toolbar(props: ToolbarProps): JSX.Element {
  return <MaterialToolbar {...props} />;
}
