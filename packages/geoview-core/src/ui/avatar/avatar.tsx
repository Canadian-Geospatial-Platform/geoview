import { memo } from 'react';
import { Avatar as MaterialAvatar, AvatarProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Avatar
 *
 * @param {AvatarProps} props the properties passed to the Avatar element
 * @returns {JSX.Element} the created Avatar element
 */
export const Avatar = memo(function Avatar(props: AvatarProps): JSX.Element {
  logger.logTraceRender('ui/avatar/avatar');

  // Get constant from props
  const { children } = props;

  return <MaterialAvatar {...props}>{children}</MaterialAvatar>;
});
