import { AppBarProps } from '@mui/material';
/**
 * A customized Material-UI AppBar component with fade-in animation support.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <AppBarUI>
 *   <Toolbar>
 *     <Typography variant="h6">My App</Typography>
 *   </Toolbar>
 * </AppBarUI>
 *
 * // With custom styling
 * <AppBarUI
 *   sx={{
 *     backgroundColor: 'custom.main',
 *     boxShadow: 'none'
 *   }}
 * >
 *   <Toolbar>
 *     <IconButton>
 *       <MenuIcon />
 *     </IconButton>
 *   </Toolbar>
 * </AppBarUI>
 * ```
 *
 * @param {AppBarUIProps} props - The properties for the AppBar component
 * @returns {JSX.Element} A rendered AppBar component with fade-in animation
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/api/app-bar/}
 */
declare function AppBarUI1(props: AppBarProps): JSX.Element;
export declare const AppBarUI: typeof AppBarUI1;
export {};
//# sourceMappingURL=appbar.d.ts.map