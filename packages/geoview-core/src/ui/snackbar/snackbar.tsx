import { forwardRef, useMemo } from 'react';

import { Alert as MaterialAlert, AlertProps, Snackbar as MaterialSnackbar } from '@mui/material';

import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { SnackbarType } from '@/core/utils/notifications';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Snackbar component
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
 * Create a customized Material UI Snackbar component for displaying app/map messages.
 * This component combines MaterialSnackbar with MaterialAlert to provide
 * informative feedback messages with animations.
 *
 * @component
 * @example
 * ```tsx
 * // Basic success message
 * <Snackbar
 *   snackBarId="success-message"
 *   message="Operation completed successfully"
 *   open={isOpen}
 *   type="success"
 * />
 *
 * // Error message with close handler
 * <Snackbar
 *   snackBarId="error-message"
 *   message="An error occurred"
 *   open={isOpen}
 *   type="error"
 *   onClose={() => setIsOpen(false)}
 * />
 *
 * // Warning message
 * <Snackbar
 *   snackBarId="warning-message"
 *   message="Please review your changes"
 *   open={isOpen}
 *   type="warning"
 * />
 * ```
 *
 * @param {SnackBarProps} props - The properties passed to the Snackbar element
 * @returns {JSX.Element} The Snackbar component
 *
 * @see {@link https://mui.com/material-ui/react-snackbar/}
 */
function SnackbarUI(props: SnackBarProps): JSX.Element {
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

export const Snackbar = SnackbarUI;
