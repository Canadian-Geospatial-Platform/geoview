import React, { memo, useEffect, useRef } from 'react';
import { Popper as MaterialPopper, PopperProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

interface EnhancedPopperProps extends PopperProps {
  onClose?: () => void;
  handleKeyDown?: (key: string, callbackFn: () => void) => void;
}

/**
 * Create a customized Material UI Popper component.
 * This is a simple wrapper around MaterialPopper that maintains
 * full compatibility with Material-UI's Popper props.
 *
 * @param {EnhancedPopperProps} props - All valid Material-UI Popper props
 * @returns {JSX.Element} The Popper component
 */
export const Popper = memo(function Popper({ open, onClose, handleKeyDown, ...props }: EnhancedPopperProps): JSX.Element {
  logger.logTraceRender('ui/popper/popper');

  // Hooks
  const fadeInAnimation = useFadeIn();
  const AnimatedPopper = animated(MaterialPopper);

  // Ref
  const popperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logger.logTraceUseEffect('UI.POPPER - handleKeyDown/onClose');

    const onKeyDown = (event: KeyboardEvent): void => {
      handleKeyDown?.(event.key, () => open && onClose?.());
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, handleKeyDown]);

  // TODO: style - manage z-index in theme
  return <AnimatedPopper sx={{ zIndex: '2000' }} style={fadeInAnimation} {...props} open={open} ref={popperRef} />;
});
