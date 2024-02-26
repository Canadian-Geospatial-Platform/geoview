/* eslint-disable react-hooks/exhaustive-deps */
import { Popper as MaterialPopper, PopperProps } from '@mui/material';

/**
 * Create a popover component
 *
 * @param {PopperProps} props popover properties
 * @returns {JSX.Element} returns popover component
 */
export function Popper(props: PopperProps): JSX.Element {
  return <MaterialPopper {...props} />;
}
