import type { AppBarProps } from '@mui/material';
import { AppBar as MaterialAppBar } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

// Outside component - no need for props
const AnimatedAppBar = animated(MaterialAppBar);

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
function AppBarUI1(props: AppBarProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/appbar/appbar');

  const fadeInAnimation = useFadeIn();
  return <AnimatedAppBar style={fadeInAnimation} {...props} />;
}

// Named AppBarUI because there's a conflicting (with core component) name via export * from '@/ui'; in external-types.ts
export const AppBarUI = AppBarUI1;
