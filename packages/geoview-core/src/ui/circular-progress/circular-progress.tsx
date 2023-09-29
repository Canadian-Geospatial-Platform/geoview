/* eslint-disable react/require-default-props */
import { CSSProperties } from 'react';
import { CircularProgress as MaterialCircularProgress, CircularProgressProps, Box } from '@mui/material';

/**
 * Circular Progress Properties
 */
interface TypeCircularProgressProps extends CircularProgressProps {
  className?: string;
  style?: CSSProperties;
  isLoaded: boolean;
}

/**
 * Create a customized Material UI Circular Progress
 *
 * @param {TypeCircularProgressProps} props the properties passed to the circular progress element
 * @returns {JSX.Element} the created Circular Progress element
 */
export function CircularProgress(props: TypeCircularProgressProps): JSX.Element {
  const { className, style = {}, isLoaded } = props;

  return isLoaded ? (
    <Box className={`${className !== undefined && className}`} style={{ ...style }}>
      <MaterialCircularProgress />
    </Box>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );
}
