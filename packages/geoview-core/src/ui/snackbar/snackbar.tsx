import { forwardRef, useMemo } from 'react';

import { Alert as MaterialAlert, AlertProps, Snackbar as MaterialSnackbar } from '@mui/material';

import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { SnackbarType } from '@/core/utils/notifications';
import { logger } from '@/core/utils/logger';

/**
 * Snackbar properties interface
 */
interface SnackBarProps {
  snackBarId: string;
  message: string;
  open: boolean;
  type: SnackbarType;
  button?: JSX.Element;
  onClose?: (event?: React.SyntheticEvent | Event, reason?: string) => void;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MaterialAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

/**
 * Create a app/map message component to inform user on viewer state
 * - severity: 'success', 'warning', 'error', 'info'
 * @param {SnackBarProps} props the snackbar properties
 */
// GV: The message is almost always new, we do not memo
export function Snackbar(props: SnackBarProps): JSX.Element {
  logger.logTraceRender('ui/snackbar/snackbar', props);

  // Get constant from props
  const { snackBarId, open, message, type, button, onClose, ...rest } = props;

  // Hooks
  const fadeInAnimation = useFadeIn();
  const AnimatedSnackbar = animated(MaterialSnackbar);

  // Memoize static styles and props
  const memoSnackbarStyles = useMemo(
    () => ({
      position: 'absolute',
      bottom: '40px!important',
    }),
    []
  );

  // Memoize static snackbar props
  const memoSnackbarProps = useMemo(
    () => ({
      anchorOrigin: { vertical: 'bottom' as const, horizontal: 'center' as const },
      autoHideDuration: 6000,
    }),
    []
  );

  return (
    <AnimatedSnackbar
      style={fadeInAnimation}
      sx={memoSnackbarStyles}
      id={snackBarId}
      open={open}
      onClose={() => onClose?.()}
      {...memoSnackbarProps}
      {...rest}
    >
      <Alert onClose={() => onClose?.()} severity={type} sx={{ width: '100%' }}>
        {message}
        {button !== undefined && button}
      </Alert>
    </AnimatedSnackbar>
  );
}
