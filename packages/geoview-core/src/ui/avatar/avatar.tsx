import { memo } from 'react';
import { Avatar as MaterialAvatar, AvatarProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Avatar component.
 * This is a simple wrapper around MaterialAvatar that maintains
 * full compatibility with Material-UI's Avatar props.
 *
 * @param {AvatarProps} props - All valid Material-UI Avatar props
 * @returns {JSX.Element} The Avatar component
 */
export const Avatar = memo(function Avatar(props: AvatarProps): JSX.Element {
  logger.logTraceRender('ui/avatar/avatar');

  // Get constant from props
  const { children } = props;

  return <MaterialAvatar {...props}>{children}</MaterialAvatar>;
});
