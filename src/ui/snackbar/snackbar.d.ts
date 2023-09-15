/// <reference types="react" />
/**
 * Snackbar properties interface
 */
interface SnackBarProps {
    snackBarId: string;
}
/**
 * Create a app/map message component to inform user on viewer state
 * - severity: 'success', 'warning', 'error', 'info'
 * @param {SnackBarProps} props the snackbar properties
 */
export declare function Snackbar(props: SnackBarProps): JSX.Element;
export {};
