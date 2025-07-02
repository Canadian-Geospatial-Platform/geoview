import { MenuProps } from '@mui/material';
/**
 * Create a customized Material UI Menu component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Menu
 *   open={isOpen}
 *   anchorEl={anchorEl}
 *   onClose={handleClose}
 * >
 *   <MenuItem>Option 1</MenuItem>
 *   <MenuItem>Option 2</MenuItem>
 * </Menu>
 *
 * // With custom styling
 * <Menu
 *   className="custom-menu"
 *   open={isOpen}
 *   anchorEl={anchorEl}
 * >
 *   <MenuItem>Menu Item</MenuItem>
 * </Menu>
 *
 * // With position
 * <Menu
 *   open={isOpen}
 *   anchorEl={anchorEl}
 *   anchorOrigin={{
 *     vertical: 'bottom',
 *     horizontal: 'right',
 *   }}
 * >
 *   <MenuItem>Positioned Item</MenuItem>
 * </Menu>
 * ```
 *
 * @param {MenuProps} props - All valid Material-UI Menu props
 * @returns {JSX.Element} The Menu component
 *
 * @see {@link https://mui.com/material-ui/react-menu/}
 */
declare function MenuUI(props: MenuProps): JSX.Element;
export declare const Menu: typeof MenuUI;
export {};
//# sourceMappingURL=menu.d.ts.map