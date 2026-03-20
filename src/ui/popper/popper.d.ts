import type { ReactElement } from 'react';
import type { PopperProps } from '@mui/material';
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
declare function PopperUI({ open, onClose, handleKeyDown, focusSelector, focusTrap, children, ...props }: PopperPropsExtend): JSX.Element;
export declare const Popper: typeof PopperUI;
export {};
//# sourceMappingURL=popper.d.ts.map