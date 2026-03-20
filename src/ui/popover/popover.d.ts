import type { PopoverProps } from '@mui/material';
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
declare function PopoverUI({ open, children, ...props }: PopoverProps): JSX.Element;
export declare const Popover: typeof PopoverUI;
export {};
//# sourceMappingURL=popover.d.ts.map