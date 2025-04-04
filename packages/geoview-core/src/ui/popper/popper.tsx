import { useEffect, useRef } from 'react';
import { Popper as MaterialPopper, PopperProps } from '@mui/material';
import { animated } from '@react-spring/web';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Popper component extending Material-UI's PopperProps
 */
interface PopperPropsExtend extends PopperProps {
  onClose?: () => void;
  handleKeyDown?: (key: string, callbackFn: () => void) => void;
}

/**
 * Create a customized Material UI Popper component.
 *
 * @component
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
 * @param {PopperPropsExtend} props - The properties passed to the Popper element
 * @returns {JSX.Element} The Popper component
 *
 * @see {@link https://mui.com/material-ui/react-popper/|Material-UI Popper}
 */
function PopperUI({ open, onClose, handleKeyDown, ...props }: PopperPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/popper/popper');

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
}

export const Popper = PopperUI;
