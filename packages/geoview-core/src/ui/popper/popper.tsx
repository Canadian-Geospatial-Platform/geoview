/* eslint-disable react-hooks/exhaustive-deps */
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
export const Popper: React.FC<EnhancedPopperProps> = (props) => {
  const { open, anchorEl, onClose, ...restProps } = props;
  const popperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open && onClose) {
        // Close the Popper when 'Escape' key is pressed
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popperRef.current && !popperRef.current.contains(event.target as Node) && open && onClose) {
        // Close the Popper when a click occurs outside
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  return <MaterialPopper sx={{ zIndex: '150' }} ref={popperRef} {...props} />;
};
