/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import { Popover as MaterialPopover, PopoverProps } from '@mui/material';
import { ARROW_KEYS_WITH_SPACE } from '@/core/utils/constant';

/**
 * Create a popover component
 *
 * @param {PopoverProps} props popover properties
 * @returns {JSX.Element} returns popover component
 */
export function Popover(props: PopoverProps): JSX.Element {
  const { open } = props;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (ARROW_KEYS_WITH_SPACE.includes(event.code as string)) {
      // disbale the default behaviour of key down if it's part of 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', or 'Space'
      event.preventDefault();
    }
  };

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);
  return <MaterialPopover {...props} />;
}
