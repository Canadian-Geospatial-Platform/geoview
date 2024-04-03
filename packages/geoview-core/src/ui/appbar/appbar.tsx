import { AppBar as MaterialAppBar, AppBarProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
/**
 * Create a AppBar component
 *
 * @param {AppBarProps} props AppBar properties
 * @returns {JSX.Element} returns AppBar component
 */
export function AppBar(props: AppBarProps): JSX.Element {
  const fadeInAnimation = useFadeIn();
  const AnimatedAppBar = animated(MaterialAppBar);

  return <AnimatedAppBar style={fadeInAnimation} {...props} />;
}
