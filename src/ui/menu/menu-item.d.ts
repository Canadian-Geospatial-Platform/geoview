import type { MenuItemProps } from '@mui/material';
/**
 * Material-UI MenuItem component for menu item options.
 *
 * Wraps Material-UI's MenuItem to provide interactive menu option element.
 * Supports click handling, disabled state, and custom styling. Best used within
 * Menu component. All Material-UI MenuItem props are supported.
 *
 * @param props - MenuItem configuration (see MUI docs for all available props)
 * @returns MenuItem component for menu selection options
 *
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
 * @see {@link https://mui.com/material-ui/api/menu-item/}
 */
declare function MenuItemUI(props: MenuItemProps): JSX.Element;
export declare const MenuItem: typeof MenuItemUI;
export {};
//# sourceMappingURL=menu-item.d.ts.map