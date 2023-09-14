import { Avatar as MaterialAvatar, AvatarProps } from '@mui/material';

/**
 * Create a customized Material UI Avatar
 *
 * @param {AvatarProps} props the properties passed to the Avatar element
 * @returns {JSX.Element} the created Avatar element
 */
export function Avatar(props: AvatarProps): JSX.Element {
  const { children } = props;

  return <MaterialAvatar {...props}>{children !== undefined && children}</MaterialAvatar>;
}
