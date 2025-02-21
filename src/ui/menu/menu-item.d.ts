import { MenuItemProps } from '@mui/material';
/**
 * Create a customized Material UI Menu Item component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <MenuItem>Menu Option</MenuItem>
 *
 * // With onClick handler
 * <MenuItem onClick={handleClick}>
 *   Click Me
 * </MenuItem>
 *
 * // With custom styling
 * <MenuItem
 *   className="custom-item"
 *   style={{ color: 'primary' }}
 * >
 *   Styled Item
 * </MenuItem>
 *
 * // Disabled state
 * <MenuItem disabled>
 *   Disabled Option
 * </MenuItem>
 * ```
 *
 * @param {MenuItemProps} props - All valid Material-UI Menu Item props
 * @returns {JSX.Element} The Menu Item component
 *
 * @see {@link https://mui.com/material-ui/api/menu-item/}
 */
declare function MenuItemUI(props: MenuItemProps): JSX.Element;
export declare const MenuItem: typeof MenuItemUI;
export {};
