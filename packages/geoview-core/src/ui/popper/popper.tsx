/* eslint-disable react/function-component-definition */
import React, { useEffect, useRef } from 'react';
import { Popper as MaterialPopper, PopperProps } from '@mui/material';

interface EnhancedPopperProps extends PopperProps {
  onClose?: () => void;
}

/**
 * Create a popover component
 *
 * @param {EnhancedPopperProps} props popover properties
 * @returns {JSX.Element} returns popover component
 */
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

  return <MaterialPopper sx={{ zIndex: '2000' }} {...restProps} open={open} ref={popperRef} />;
};
