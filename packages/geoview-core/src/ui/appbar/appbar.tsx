import { AppBar as MaterialAppBar, AppBarProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
/**
 * Create a AppBar component
 *
 * @param {AppBarProps} props AppBar properties
 * @returns {JSX.Element} returns AppBar component
 */
export function AppBarUI(props: AppBarProps): JSX.Element {
  // TODO: Refactor - If we want this named 'AppBar' we have to rename the one in Geoview components.
  // TO.DOCONT: Otherwise there's a conflicting name via export * from '@/ui'; in external-types.ts
  const fadeInAnimation = useFadeIn();
  const AnimatedAppBar = animated(MaterialAppBar);

  return <AnimatedAppBar style={fadeInAnimation} {...props} />;
}
