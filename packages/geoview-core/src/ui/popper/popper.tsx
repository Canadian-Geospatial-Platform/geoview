import React, { useEffect, useRef } from 'react';
import { Popper as MaterialPopper, PopperProps } from '@mui/material';
import { animated, useSpring, easings } from '@react-spring/web';

interface EnhancedPopperProps extends PopperProps {
  // eslint-disable-next-line react/require-default-props
  onClose?: () => void;
  handleKeyDown?: (key: string, callbackFn: () => void) => void;
}

/**
 * Create a popover component
 *
 * @param {EnhancedPopperProps} props popover properties
 * @returns {JSX.Element} returns popover component
 */
/* eslint-disable-next-line react/function-component-definition */
export const Popper: React.FC<EnhancedPopperProps> = ({ open, onClose, handleKeyDown, ...restProps }) => {
  const popperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void =>
      handleKeyDown?.(event.key, () => {
        if (event.key === 'Escape' && open && onClose) {
          // Close the Popper when 'Escape' key is pressed
          onClose();
        }
      });

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, handleKeyDown]);

  const springProps = useSpring({
    config: { duration: 250, easing: easings.easeInExpo },
    opacity: open ? 1 : 0,
  });
  const AnimatedPopper = animated(MaterialPopper);

  return <AnimatedPopper sx={{ zIndex: '2000' }} style={springProps} {...restProps} open={open} ref={popperRef} />;
};
