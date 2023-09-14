import { CircularProgress as MaterialCircularProgress, CircularProgressProps } from '@mui/material';

/**
 * Create a customized Material UI Circular Progress
 *
 * @param {TypeCircularProgressProps} props the properties passed to the circular progress element
 * @returns {JSX.Element} the created Circular Progress element
 */
export function CircularProgressBase(props: CircularProgressProps): JSX.Element {
  return <MaterialCircularProgress {...props} />;
}
