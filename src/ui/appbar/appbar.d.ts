import type { AppBarProps } from '@mui/material';
/**
 * Material-UI AppBar with automatic fade-in animation on mount.
 *
 * Wraps Material-UI's AppBar component with React Spring animations to provide
 * a smooth fade-in effect when the component initially renders. All Material-UI
 * AppBar props are supported and passed through directly. Useful for providing
 * visual continuity and polish to page transitions.
 *
 * @param props - Material-UI AppBar properties (see MUI docs for all available props)
 * @returns AppBar element with fade-in animation applied on render
 *
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
 * @see {@link https://mui.com/material-ui/api/app-bar/}
 */
declare function AppBarUI1(props: AppBarProps): JSX.Element;
export declare const AppBarUI: typeof AppBarUI1;
export {};
//# sourceMappingURL=appbar.d.ts.map