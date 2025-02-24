import { BadgeProps } from '@mui/material';
/**
 * A customized Material-UI Badge component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Badge badgeContent={4}>
 *   <MailIcon />
 * </Badge>
 *
 * // With custom color
 * <Badge
 *   badgeContent={100}
 *   color="secondary"
 *   max={99}
 * >
 *   <NotificationsIcon />
 * </Badge>
 *
 * // With custom styling
 * <Badge
 *   badgeContent={4}
 *   sx={{
 *     '& .MuiBadge-badge': {
 *       backgroundColor: 'custom.main'
 *     }
 *   }}
 * >
 *   <IconButton>
 *     <MessageIcon />
 *   </IconButton>
 * </Badge>
 * ```
 *
 * @param {BadgeProps} props - The properties for the Badge component
 * @returns {JSX.Element} A rendered Badge component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/api/badge/}
 */
declare function BadgeUI(props: BadgeProps): JSX.Element;
export declare const Badge: typeof BadgeUI;
export {};
