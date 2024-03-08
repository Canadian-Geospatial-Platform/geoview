import { forwardRef } from 'react';

import { Alert as MaterialAlert, AlertProps, Snackbar as MaterialSnackbar } from '@mui/material';

import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { SnackbarType } from '@/api/events/payloads/snackbar-message-payload';
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
export function Snackbar(props: SnackBarProps): JSX.Element {
  // Log
  logger.logTraceRender('SNACKBAR', props);

  // Read props
  const { snackBarId, open, message, type, button, onClose } = props;

  const fadeInAnimation = useFadeIn();
  const AnimatedSnackbar = animated(MaterialSnackbar);

  return (
    <AnimatedSnackbar
      style={fadeInAnimation}
      sx={{
        position: 'absolute',
        bottom: '40px!important',
      }}
      id={snackBarId}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={open}
      autoHideDuration={6000}
      onClose={() => onClose?.()}
    >
      <Alert onClose={() => onClose?.()} severity={type} sx={{ width: '100%' }}>
        {message}
        {button !== undefined && button}
      </Alert>
    </AnimatedSnackbar>
  );
}

Snackbar.defaultProps = {
  button: undefined,
  onClose: undefined,
};
