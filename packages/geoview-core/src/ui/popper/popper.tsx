import type { ReactElement } from 'react';
import { useEffect, useRef, useCallback } from 'react';
import type { PopperProps } from '@mui/material';
import { Popper as MaterialPopper, useTheme } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';
import { FocusTrap } from '@/ui';
import { delay } from '@/core/utils/utilities';

/**
 * Properties for the Popper component extending Material-UI's PopperProps
 */
interface PopperPropsExtend extends PopperProps {
  onClose?: () => void;
  handleKeyDown?: (key: string, callbackFn: () => void) => void;
  focusSelector?: string;
  focusTrap?: boolean;
  children: ReactElement;
}

/**
 * Material-UI Popper component with fade animation and keyboard management.
 *
 * Wraps Material-UI's Popper to provide floating layer positioned relative to an
 * anchor element. Includes React Spring fade-in animation, keyboard event handling,
 * focus trap support, and automatic focus management. Useful for dropdown menus,
 * select options, and floating UI panels.
 *
 * @param props - Popper configuration (see PopperPropsExtend interface)
 * @returns Popper component with fade animation and focus management
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Popper
 *   open={isOpen}
 *   anchorEl={anchorElement}
 * >
 *   <Paper>
 *     <Typography>Popper content</Typography>
 *   </Paper>
 * </Popper>
 *
 * // With placement and keyboard handling
 * <Popper
 *   open={isOpen}
 *   anchorEl={anchorElement}
 *   placement="bottom-start"
 *   onClose={handleClose}
 *   handleKeyDown={(key, callback) => {
 *     if (key === 'Escape') callback();
 *   }}
 * >
 *   <Box p={2}>Interactive content</Box>
 * </Popper>
 *
 * // With custom styling
 * <Popper
 *   open={isOpen}
 *   anchorEl={anchorElement}
 *   sx={{
 *     zIndex: 'tooltip',
 *     '& .MuiPaper-root': {
 *       p: 2
 *     }
 *   }}
 * >
 *   <Typography>Styled content</Typography>
 * </Popper>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-popper/}
 */
function PopperUI({ open, onClose, handleKeyDown, focusSelector, focusTrap = false, children, ...props }: PopperPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/popper/popper');

  // Hooks
  const fadeInAnimation = useFadeIn();
  const AnimatedPopper = animated(MaterialPopper);
  const theme = useTheme();

  // Ref
  const popperRef = useRef<HTMLDivElement | null>(null);
  const setPopperRef = useCallback((node: HTMLDivElement | null) => {
    popperRef.current = node;
  }, []);

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

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.POPPER - handle focus management', open, focusSelector);

    // Focus management when popper opens
    if (open && focusSelector) {
      // Wait the transition period then focus the close button when popover opens
      delay(theme.transitions.duration.shortest)
        .then(() => {
          const focusElement = popperRef.current?.querySelector(focusSelector) as HTMLElement;
          if (focusElement) {
            focusElement.focus();
          }
        })
        .catch(() => {
          logger.logPromiseFailed('in delay in UI.POPPER - open');
        });
    }
  }, [open, focusSelector, theme.transitions.duration.shortest]);

  // TODO: style - manage z-index in theme
  return (
    <AnimatedPopper sx={{ zIndex: '2000' }} style={fadeInAnimation} {...props} open={open} ref={setPopperRef}>
      {focusTrap ? (
        <FocusTrap open={open} disableAutoFocus>
          {children}
        </FocusTrap>
      ) : (
        children
      )}
    </AnimatedPopper>
  );
}

export const Popper = PopperUI;
