/// <reference types="react" />
import { SnackbarType } from '@/core/utils/notifications';
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
/**
 * Create a app/map message component to inform user on viewer state
 * - severity: 'success', 'warning', 'error', 'info'
 * @param {SnackBarProps} props the snackbar properties
 */
export declare function Snackbar(props: SnackBarProps): JSX.Element;
export {};
