// GV: THIS UI COMPONENT IS NOT USE
import { Avatar as MaterialAvatar, AvatarProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Avatar component extending Material-UI's AvatarProps
 */
export interface AvatarPropsExtend extends AvatarProps {
  /** Content to be rendered inside the Avatar */
  children?: React.ReactNode;
}

/**
 * A customized Material-UI Avatar component.
 *
 * @component
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
 * @param {AvatarPropsExtend} props - The properties for the Avatar component
 * @returns {JSX.Element} A rendered Avatar component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/api/avatar/}
 */
function AvatarUI(props: AvatarPropsExtend): JSX.Element {
  logger.logTraceRender('ui/avatar/avatar');

  // Get constant from props
  const { children } = props;

  return <MaterialAvatar {...props}>{children}</MaterialAvatar>;
}

export const Avatar = AvatarUI;
