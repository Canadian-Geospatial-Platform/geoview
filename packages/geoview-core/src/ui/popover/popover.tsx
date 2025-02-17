import { memo, useEffect } from 'react';
import { Popover as MaterialPopover, PopoverProps } from '@mui/material';
import { ARROW_KEYS_WITH_SPACE } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';

// Disable arrow key so user can't move the page when popover is open
const handleKeyDown = (event: KeyboardEvent): void => {
  if (ARROW_KEYS_WITH_SPACE.includes(event.code as string)) {
    // disbale the default behaviour of key down if it's part of 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', or 'Space'
    event.preventDefault();
  }
};

/**
 * Create a customized Material UI Popover component.
 * This is a simple wrapper around MaterialPopover that maintains
 * full compatibility with Material-UI's Popover props.
 *
 * @param {PopoverProps} props - All valid Material-UI Popover props
 * @returns {JSX.Element} The Popover component
 */
export const Popover = memo(function Popover(props: PopoverProps): JSX.Element {
  logger.logTraceRender('ui/popover/popover');

  // Get constant from props
  const { open } = props;

  useEffect(() => {
    logger.logTraceUseEffect('UI.POPOVER - handleKeyDown', open);
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);
  return <MaterialPopover {...props} />;
});
