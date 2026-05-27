import { forwardRef, useMemo } from 'react';

import type { AlertProps } from '@mui/material';
import { Alert as MaterialAlert, Snackbar as MaterialSnackbar } from '@mui/material';

import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import type { SnackbarType } from '@/core/utils/notifications';
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
  closeButtonText?: string;
  onClose?: (event?: React.SyntheticEvent | Event, reason?: string) => void;
}

/**
 * Material-UI Alert wrapper component with elevated styling.
 *
 * @param props - Alert properties from Material-UI AlertProps
 * @returns Alert component with filled variant and elevation
 */
const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MaterialAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

/**
 * Material-UI Snackbar component for displaying app/map notification messages.
 *
 * Combines Material-UI's Snackbar with Alert to provide animated feedback messages
 * with type-based styling (success, error, warning, info). Supports custom action buttons
 * and close callbacks. Uses React Spring animations for fade-in effect.
 *
 * @param props - Snackbar configuration (see SnackBarProps)
 * @returns Snackbar component with animated alert message
 *
 * @example
 * ```tsx
 * // Success notification
 * <Snackbar
 *   snackBarId="success-msg"
 *   message="Operation completed"
 *   open={isOpen}
 *   type="success"
 *   onClose={handleClose}
 * />
 *
 * // Error with action button
 * <Snackbar
 *   snackBarId="error-msg"
 *   message="An error occurred"
 *   open={isOpen}
 *   type="error"
 *   button={<Button onClick={handleRetry}>Retry</Button>}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-snackbar/}
 */
function SnackbarUI(props: SnackBarProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/snackbar/snackbar', props);

  // Get constant from props
  const { snackBarId, open, message, type, button, closeButtonText, onClose, ...rest } = props;

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
  const memoSnackbarProps = useMemo(() => {
    logger.logTraceUseMemo('SNACKBAR - memoSnackbarProps');
    return {
      anchorOrigin: { vertical: 'bottom' as const, horizontal: 'center' as const },
      autoHideDuration: 5000,
    };
  }, []);

  return (
    <AnimatedSnackbar
      style={fadeInAnimation}
      sx={memoSnackbarStyles}
      id={snackBarId}
      open={open}
      {...(onClose && { onClose })} // Only spreads { onClose: fn } when onClose exists
      {...memoSnackbarProps}
      {...rest}
    >
      <Alert
        {...(onClose && {
          onClose,
          ...(closeButtonText && { closeText: closeButtonText }),
        })}
        severity={type}
        sx={{ width: '100%' }}
      >
        {message}
        {button !== undefined && button}
      </Alert>
    </AnimatedSnackbar>
  );
}

export const Snackbar = SnackbarUI;
