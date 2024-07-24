/* eslint-disable react/require-default-props */
import { CSSProperties } from 'react';

import { useTheme } from '@mui/material/styles';
import { CircularProgress as MaterialCircularProgress, CircularProgressProps, Box, Fade } from '@mui/material';

import { getSxClasses } from './circular-progress-style';

/**
 * Circular Progress Properties
 */
interface TypeCircularProgressProps extends CircularProgressProps {
  isLoaded: boolean;
  style?: CSSProperties;
  sx?: CSSProperties;
}

/**
 * Create a customized Material UI Circular Progress
 *
 * @param {TypeCircularProgressProps} props the properties passed to the circular progress element
 * @returns {JSX.Element} the created Circular Progress element
 */
export function CircularProgress(props: TypeCircularProgressProps): JSX.Element {
  const { style = {}, isLoaded, sx = {}, ...rest } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <Fade in={!isLoaded} timeout={250} mountOnEnter unmountOnExit>
      <Box sx={{ ...sxClasses.loading, ...sx }} style={{ ...style }}>
        <MaterialCircularProgress sx={sxClasses.progress} {...rest} />
      </Box>
    </Fade>
  );
}
