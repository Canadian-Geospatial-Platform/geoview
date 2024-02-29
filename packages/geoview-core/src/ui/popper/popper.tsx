import React, { useEffect, useRef } from 'react';
import { Popper as MaterialPopper, PopperProps } from '@mui/material';
import { animated, useSpring, easings } from '@react-spring/web';

interface EnhancedPopperProps extends PopperProps {
  // eslint-disable-next-line react/require-default-props
  onClose?: () => void;
}

/**
 * Create a popover component
 *
 * @param {EnhancedPopperProps} props popover properties
 * @returns {JSX.Element} returns popover component
 */
/* eslint-disable-next-line react/function-component-definition */
export const Popper: React.FC<EnhancedPopperProps> = ({ open, onClose, ...restProps }) => {
  const popperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open && onClose) {
        // Close the Popper when 'Escape' key is pressed
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [open, onClose]);

  const springProps = useSpring({
    config: { duration: 500, easing: easings.easeInExpo },
    opacity: open ? 1 : 0,
  });
  const AnimatedPopper = animated(MaterialPopper);

  return <AnimatedPopper sx={{ zIndex: '2000' }} style={springProps} {...restProps} open={open} ref={popperRef} />;
};
