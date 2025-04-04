import { useEffect } from 'react';
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
 *
 * @component
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
 * @param {PopoverProps} props - All valid Material-UI Popover props
 * @returns {JSX.Element} The Popover component
 *
 * @see {@link https://mui.com/material-ui/react-popover/|Material-UI Popover}
 */
function PopoverUI(props: PopoverProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/popover/popover');

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
}

export const Popover = PopoverUI;
