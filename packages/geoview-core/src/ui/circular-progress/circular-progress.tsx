/* eslint-disable react/require-default-props */
import { CSSProperties } from 'react';
import { CircularProgress as MaterialCircularProgress, CircularProgressProps } from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';

/**
 * Circular Progress Properties
 */
interface TypeCircularProgressProps extends CircularProgressProps {
  className?: string;
  style?: CSSProperties;
  isLoaded: boolean;
}

const useStyles = makeStyles((theme) => {
  return {
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: '0px',
      bottom: '0px',
      left: '0px',
      right: '0px',
      zIndex: 10000,
      backgroundColor: '#000000',
      textAlign: 'center',
      transition: theme.transitions.create(['visibility', 'opacity'], {
        delay: theme.transitions.duration.shortest,
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.splash,
      }),
    },
    progress: {
      width: '100px !important',
      height: '100px !important',
      position: 'absolute',
    },
  };
});

/**
 * Create a customized Material UI Circular Progress
 *
 * @param {TypeCircularProgressProps} props the properties passed to the circular progress element
 * @returns {JSX.Element} the created Circular Progress element
 */
export function CircularProgress(props: TypeCircularProgressProps): JSX.Element {
  const { className, style, isLoaded } = props;
  const classes = useStyles();

  return !isLoaded ? (
    <div className={`${classes.loading} ${className !== undefined && className}`} style={{ ...style }}>
      <MaterialCircularProgress className={classes.progress} />
    </div>
  ) : (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <></>
  );
}
