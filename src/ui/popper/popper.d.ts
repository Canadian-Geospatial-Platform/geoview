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
declare function PopperUI({ open, onClose, handleKeyDown, focusSelector, focusTrap, children, ...props }: PopperPropsExtend): JSX.Element;
export declare const Popper: typeof PopperUI;
export {};
//# sourceMappingURL=popper.d.ts.map