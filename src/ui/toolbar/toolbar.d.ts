import { ToolbarProps } from '@mui/material';
/**
 * Create a customized Material UI Toolbar component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Toolbar>
 *   <Typography>Title</Typography>
 * </Toolbar>
 *
 * // With custom styling
 * <Toolbar
 *   sx={{
 *     backgroundColor: 'primary.main',
 *     color: 'primary.contrastText'
 *   }}
 * />
 * ```
 *
 * @param {ToolbarProps} props - All valid Material-UI Toolbar props
 * @returns {JSX.Element} The Toolbar component
 *
 * @see {@link https://mui.com/material-ui/react-app-bar/}
 */
declare function ToolbarUI(props: ToolbarProps): JSX.Element;
export declare const Toolbar: typeof ToolbarUI;
export {};
