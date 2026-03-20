import type { AvatarProps } from '@mui/material';
/**
 * Properties for the Avatar component extending Material-UI's AvatarProps
 */
export interface AvatarPropsExtend extends AvatarProps {
    /** React node rendered inside the Avatar (text, icons, or images) */
    children?: React.ReactNode;
}
/**
 * Material-UI Avatar component for displaying user profile images or initials.
 *
 * Wraps Material-UI's Avatar to provide a flexible component for rendering
 * avatar images, initials, or custom icons. All Material-UI Avatar props are
 * supported and passed through directly. Useful for user profiles, team displays,
 * and authentication status indicators.
 *
 * @param props - Avatar configuration (see AvatarPropsExtend interface and MUI docs)
 * @returns Avatar component with children or image shown
 *
 * @example
 * ```tsx
 * // Basic usage with text
 * <Avatar>JD</Avatar>
 *
 * // With image
 * <Avatar
 *   alt="User Name"
 *   src="/path/to/image.jpg"
 * />
 *
 * // With custom styling
 * <Avatar
 *   sx={{
 *     bgcolor: 'primary.main',
 *     width: 56,
 *     height: 56
 *   }}
 * >
 *   <PersonIcon />
 * </Avatar>
 * ```
 *
 * @see {@link https://mui.com/material-ui/api/avatar/}
 */
declare function AvatarUI(props: AvatarPropsExtend): JSX.Element;
export declare const Avatar: typeof AvatarUI;
export {};
//# sourceMappingURL=avatar.d.ts.map