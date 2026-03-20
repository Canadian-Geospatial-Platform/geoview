import type { MenuProps } from '@mui/material';
/**
 * Material-UI Menu component for dropdown menu container.
 *
 * Wraps Material-UI's Menu to provide dropdown menu container positioned relative
 * to an anchor element. Supports custom positioning, animations, and all Material-UI
 * Menu props. Best used with MenuItem components for complete menu hierarchies.
 *
 * @param props - Menu configuration (see MUI docs for all available props)
 * @returns Menu component with positioning and animation support
 *
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
 * @see {@link https://mui.com/material-ui/react-menu/}
 */
declare function MenuUI(props: MenuProps): JSX.Element;
export declare const Menu: typeof MenuUI;
export {};
//# sourceMappingURL=menu.d.ts.map