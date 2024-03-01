import { AppBar as MaterialAppBar, AppBarProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
/**
 * Create a appbar component
 *
 * @param {AppBarProps} props appbar properties
 * @returns {JSX.Element} returns appbar component
 */
export function AppBar(props: AppBarProps): JSX.Element {
  const fadeInAnimation = useFadeIn();
  const AnimatedAppBar = animated(MaterialAppBar);

  return <AnimatedAppBar style={fadeInAnimation} {...props} />;
}
