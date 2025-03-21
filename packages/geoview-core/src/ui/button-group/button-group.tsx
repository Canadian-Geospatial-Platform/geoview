import { Ref, forwardRef } from 'react';
import { ButtonGroup as MaterialButtonGroup, ButtonGroupProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

// Outside component - no need for props
const AnimatedButtonGroup = animated(MaterialButtonGroup);

/**
 * A customized Material UI button group with fade-in animation.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <ButtonGroup>
 *   <Button>One</Button>
 *   <Button>Two</Button>
 *   <Button>Three</Button>
 * </ButtonGroup>
 *
 * // With variant and color
 * <ButtonGroup
 *   variant="contained"
 *   color="primary"
 * >
 *   <Button>Left</Button>
 *   <Button>Center</Button>
 *   <Button>Right</Button>
 * </ButtonGroup>
 *
 * // With orientation
 * <ButtonGroup
 *   orientation="vertical"
 *   aria-label="vertical button group"
 * >
 *   <Button>Top</Button>
 *   <Button>Middle</Button>
 *   <Button>Bottom</Button>
 * </ButtonGroup>
 * ```
 *
 * @param {ButtonGroupProps} props - The properties for the ButtonGroup component
 * @param {Ref<HTMLDivElement>} ref - The ref forwarded to the underlying MaterialButtonGroup
 * @returns {JSX.Element} A rendered Button Group element
 *
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-button-group/}
 */
function ButtonGroupUI(props: ButtonGroupProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/button-group/button-group');

  // Get constant from props
  const { children, ...otherProps } = props;

  // Hook
  const fadeInAnimation = useFadeIn();

  return (
    <AnimatedButtonGroup style={fadeInAnimation} {...otherProps} ref={ref}>
      {children && children}
    </AnimatedButtonGroup>
  );
}

// Export the Button Group using forwardRef so that passing ref is permitted and functional in the react standards
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(ButtonGroupUI);
