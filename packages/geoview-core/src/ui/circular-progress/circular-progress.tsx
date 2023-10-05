/* eslint-disable react/require-default-props */
import { CSSProperties } from 'react';
import { CircularProgress as MaterialCircularProgress, CircularProgressProps, Box, useTheme } from '@mui/material';
import { getSxClasses } from './circular-progress-style';
/**
 * Circular Progress Properties
 */
interface TypeCircularProgressProps extends CircularProgressProps {
  isLoaded: boolean;
  style?: CSSProperties;
}

/**
 * Create a customized Material UI Circular Progress
 *
 * @param {TypeCircularProgressProps} props the properties passed to the circular progress element
 * @returns {JSX.Element} the created Circular Progress element
 */
export function CircularProgress(props: TypeCircularProgressProps): JSX.Element {
  const { style = {}, isLoaded } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return !isLoaded ? (
    <Box sx={sxClasses.loading} style={{ ...style }}>
      <MaterialCircularProgress sx={sxClasses.progress} />
    </Box>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );
}
