import { useEffect, isValidElement } from 'react';
import type { PopoverProps } from '@mui/material';
import { Popover as MaterialPopover } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { FocusTrap } from '@/ui';
import { ARROW_KEYS_WITH_SPACE } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { delay } from '@/core/utils/utilities';

// Disable arrow key so user can't move the page when popover is open
const handleKeyDown = (event: KeyboardEvent): void => {
  if (ARROW_KEYS_WITH_SPACE.includes(event.code)) {
    // disbale the default behaviour of key down if it's part of 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', or 'Space'
    event.preventDefault();
  }
};

/**
 * Material-UI Popover component with keyboard and focus management.
 *
 * Wraps Material-UI's Popover to provide popup panel positioned relative to an anchor
 * element. Includes keyboard event handling (disables arrow keys/space to prevent page
 * scrolling while open), automatic focus management, and focus trap support. Useful for
 * tooltips, dropdown menus, and positioned content panels.
 *
 * @param props - Popover configuration (see MUI docs for all available props)
 * @returns Popover component with keyboard management and focus handling
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Popover
 *   open={isOpen}
 *   anchorEl={anchorElement}
 *   onClose={handleClose}
 * >
 *   <Typography>Popover content</Typography>
 * </Popover>
 *
 * // With positioning
 * <Popover
 *   open={isOpen}
 *   anchorEl={anchorElement}
 *   anchorOrigin={{
 *     vertical: 'bottom',
 *     horizontal: 'center',
 *   }}
 *   transformOrigin={{
 *     vertical: 'top',
 *     horizontal: 'center',
 *   }}
 * >
 *   <Box p={2}>Positioned content</Box>
 * </Popover>
 *
 * // With custom styling
 * <Popover
 *   open={isOpen}
 *   anchorEl={anchorElement}
 *   className="custom-popover"
 *   PaperProps={{
 *     sx: { p: 2 }
 *   }}
 * >
 *   <Typography>Styled content</Typography>
 * </Popover>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-popover/}
 */
function PopoverUI({ open, children, ...props }: PopoverProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/popover/popover');

  // Hook
  const theme = useTheme();

  useEffect(() => {
    logger.logTraceUseEffect('UI.POPOVER - handleKeyDown', open);
    if (open) {
      window.addEventListener('keydown', handleKeyDown);

      // Wait the transition period then focus the close button when popover opens
      delay(theme.transitions.duration.shortest)
        .then(() => {
          const closeButton = document.querySelector('[data-testid="CloseIcon"]')?.closest('button') as HTMLButtonElement;
          if (closeButton) {
            closeButton.focus();
          }
        })
        .catch(() => {
          logger.logPromiseFailed('in delay in UI.POPOVER - open');
        });
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, theme.transitions.duration.shortest]);

  return (
    <MaterialPopover open={open} disableScrollLock {...props}>
      <FocusTrap open={open} disableAutoFocus>
        {isValidElement(children) ? children : <span />}
      </FocusTrap>
    </MaterialPopover>
  );
}

export const Popover = PopoverUI;
