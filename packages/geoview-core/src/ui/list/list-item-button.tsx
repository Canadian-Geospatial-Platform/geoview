import MaterialListItemButton from '@mui/material/ListItemButton';
import makeStyles from '@mui/styles/makeStyles';

import { ListItemButtonProps } from '@mui/material';

const useStyles = makeStyles((theme) => ({
  listItemButton: {
    //
  },
}));

/**
 * Create a customized Material UI List Item
 *
 * @param {ListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItemButton(props: ListItemButtonProps): JSX.Element {
  const { children, className, style } = props;

  const classes = useStyles();

  return (
    <MaterialListItemButton className={`${classes.listItemButton} ${className || ''}`} style={style || undefined}>
      {children !== undefined && children}
    </MaterialListItemButton>
  );
}
