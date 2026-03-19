import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { ButtonGroupProps } from '@mui/material';
import { ButtonGroup as MaterialButtonGroup } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

// Outside component - no need for props
const AnimatedButtonGroup = animated(MaterialButtonGroup);

/**
 * Material-UI ButtonGroup with fade-in animation.
 *
 * Wraps Material-UI's ButtonGroup and adds a fade-in animation effect using
 * React Spring. Useful for grouping related action buttons with visual emphasis
 * on component mount. All Material-UI ButtonGroup props are supported and passed
 * through directly.
 *
 * @param props - ButtonGroup configuration (see ButtonGroupProps interface)
 * @param ref - Reference forwarded to underlying Material-UI ButtonGroup
 * @returns ButtonGroup component with fade-in animation on mount
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
