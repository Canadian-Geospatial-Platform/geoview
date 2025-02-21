import { SnackbarType } from '@/core/utils/notifications';
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
declare function SnackbarUI(props: SnackBarProps): JSX.Element;
export declare const Snackbar: typeof SnackbarUI;
export {};
