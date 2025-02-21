import { PopoverProps } from '@mui/material';
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
declare function PopoverUI(props: PopoverProps): JSX.Element;
export declare const Popover: typeof PopoverUI;
export {};
