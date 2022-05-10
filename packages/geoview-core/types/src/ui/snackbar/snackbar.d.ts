/**
 * Snackbar properties interface
 */
interface SnackBarProps {
    id: string;
}
/**
 * Create a app/map message component to inform user on viewer state
 * We use the notistack npm module who has the following props (https://www.npmjs.com/package/notistack)
 *      - variant: 'default','success', 'warning', 'error', 'info'
 * @param {SnackBarProps} props the snackbar properties
 */
export declare function Snackbar(props: SnackBarProps): null;
export {};
