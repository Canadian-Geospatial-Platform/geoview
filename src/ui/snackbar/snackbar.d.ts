import type { SnackbarType } from '@/core/utils/notifications';
/**
 * Properties for the Snackbar component
 */
interface SnackBarProps {
    snackBarId: string;
    message: string;
    open: boolean;
    type: SnackbarType;
    closeButtonText?: string;
    onClose?: (event?: React.SyntheticEvent | Event, reason?: string) => void;
}
/**
 * Material-UI Snackbar component for displaying app/map notification messages.
 *
 * Combines Material-UI's Snackbar with Alert to provide animated feedback messages
 * with type-based styling (success, error, warning, info). Supports close callbacks.
 * Uses React Spring animations for fade-in effect.
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
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-snackbar/}
 */
declare function SnackbarUI(props: SnackBarProps): JSX.Element;
export declare const Snackbar: typeof SnackbarUI;
export {};
//# sourceMappingURL=snackbar.d.ts.map