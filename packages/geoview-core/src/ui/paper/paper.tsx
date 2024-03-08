import { Paper as MaterialPaper, PaperProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
/**
 * Create a paper component
 *
 * @param {PaperProps} props paper properties
 * @returns {JSX.Element} returns paper component
 */
export function Paper(props: PaperProps): JSX.Element {
  const fadeInAnimation = useFadeIn();
  const AnimatedPaper = animated(MaterialPaper);

  return <AnimatedPaper style={fadeInAnimation} {...props} />;
}
