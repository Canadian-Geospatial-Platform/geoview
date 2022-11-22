import MaterialListItemIcon from '@mui/material/ListItemIcon';
import makeStyles from '@mui/styles/makeStyles';

import { ListItemIconProps } from '@mui/material';

const useStyles = makeStyles(() => ({
  listItemIcon: {
    //
  },
}));

/**
 * Create a customized Material UI List Item
 *
 * @param {ListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItemIcon(props: ListItemIconProps): JSX.Element {
  const { children, className, style } = props;

  const classes = useStyles();

  return (
    <MaterialListItemIcon className={`${classes.listItemIcon} ${className || ''}`} style={style || undefined}>
      {children !== undefined && children}
    </MaterialListItemIcon>
  );
}
