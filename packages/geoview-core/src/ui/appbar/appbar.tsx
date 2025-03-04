import { AppBar as MaterialAppBar, AppBarProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

// Outside component - no need for props
const AnimatedAppBar = animated(MaterialAppBar);

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
function AppBarUI1(props: AppBarProps): JSX.Element {
  logger.logTraceRender('ui/appbar/appbar');

  const fadeInAnimation = useFadeIn();
  return <AnimatedAppBar style={fadeInAnimation} {...props} />;
}

// Named AppBarUI because there's a conflicting (with core component) name via export * from '@/ui'; in external-types.ts
export const AppBarUI = AppBarUI1;
