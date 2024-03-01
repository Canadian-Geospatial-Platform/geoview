import { AppBar as MaterialAppBar, AppBarProps } from '@mui/material';
import { animated, useSpring, easings } from '@react-spring/web';
/**
 * Create a appbar component
 *
 * @param {AppBarProps} props appbar properties
 * @returns {JSX.Element} returns appbar component
 */
export function AppBar(props: AppBarProps): JSX.Element {
  const fadeIn = useSpring({
    config: { duration: 500, easing: easings.easeOutExpo },
    from: { opacity: 0 },
    to: { opacity: 1 },
  });
  const AnimatedAppBar = animated(MaterialAppBar);

  return <AnimatedAppBar  style={fadeIn} {...props} />;
}
