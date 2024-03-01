import { Ref, forwardRef } from 'react';
import { ButtonGroup as MaterialButtonGroup, ButtonGroupProps } from '@mui/material';
import { animated, useSpring, easings } from '@react-spring/web';

/**
 * Create a customized Material UI button group
 *
 * @param {ButtonGroupProps} props the properties passed to the button group element
 * @param {Ref<HTMLDivElement>} ref the ref object forwarded to the underlying MaterialButtonGroup
 * @returns {JSX.Element} the created Button Group element
 */
function ButtonGroupElement(props: ButtonGroupProps, ref: Ref<HTMLDivElement>): JSX.Element {
  const { children, ...otherProps } = props;

  const fadeIn = useSpring({
    config: { duration: 500, easing: easings.easeOutExpo },
    from: { opacity: 0 },
    to: { opacity: 1 },
  });
  const AnimatedButtonGroup = animated(MaterialButtonGroup);


  return (
    <AnimatedButtonGroup {...otherProps} ref={ref}>
      {children && children}
    </AnimatedButtonGroup>
  );
}

// Export the Button Group using forwardRef so that passing ref is permitted and functional in the react standards
export const ButtonGroup = forwardRef(ButtonGroupElement);
