import MaterialAvatar from '@mui/material/Avatar';
import makeStyles from '@mui/styles/makeStyles';

import { AvatarProps } from '@mui/material';

const useStyles = makeStyles((theme) => ({
  avatar: {
    //
  },
}));

/**
 * Create a customized Material UI Avatar
 *
 * @param {AvatarProps} props the properties passed to the Avatar element
 * @returns {JSX.Element} the created Avatar element
 */
export function Avatar(props: AvatarProps): JSX.Element {
  const { children, className, style, variant, src, onClick } = props;

  const classes = useStyles();

  return (
    <MaterialAvatar
      className={`${classes.avatar} ${className || ''}`}
      style={style || undefined}
      variant={variant}
      src={src}
      onClick={onClick}
    >
      {children !== undefined && children}
    </MaterialAvatar>
  );
}
