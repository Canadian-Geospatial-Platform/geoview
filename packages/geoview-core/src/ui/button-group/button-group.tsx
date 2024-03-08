import { Ref, forwardRef } from 'react';
import { ButtonGroup as MaterialButtonGroup, ButtonGroupProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';

/**
 * Create a customized Material UI button group
 *
 * @param {ButtonGroupProps} props the properties passed to the button group element
 * @param {Ref<HTMLDivElement>} ref the ref object forwarded to the underlying MaterialButtonGroup
 * @returns {JSX.Element} the created Button Group element
 */
function ButtonGroupElement(props: ButtonGroupProps, ref: Ref<HTMLDivElement>): JSX.Element {
  const { children, ...otherProps } = props;

  const fadeInAnimation = useFadeIn();
  const AnimatedButtonGroup = animated(MaterialButtonGroup);

  return (
    <AnimatedButtonGroup style={fadeInAnimation} {...otherProps} ref={ref}>
      {children && children}
    </AnimatedButtonGroup>
  );
}

// Export the Button Group using forwardRef so that passing ref is permitted and functional in the react standards
export const ButtonGroup = forwardRef(ButtonGroupElement);
