import { Paper as MaterialPaper, PaperProps } from '@mui/material';
import { animated, useSpring, easings } from '@react-spring/web';
/**
 * Create a paper component
 *
 * @param {PaperProps} props paper properties
 * @returns {JSX.Element} returns paper component
 */
export function Paper(props: PaperProps): JSX.Element {
  const fadeIn = useSpring({
    config: { duration: 500, easing: easings.easeInExpo },
    from: { opacity: 0 },
    to: { opacity: 1 }
  });
  const AnimatedPaper = animated(MaterialPaper);

  return <AnimatedPaper style={fadeIn} {...props} />;
}
