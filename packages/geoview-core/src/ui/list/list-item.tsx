import MaterialListItem from '@mui/material/ListItem';
import makeStyles from '@mui/styles/makeStyles';

import { ListItemProps } from '@mui/material';

const useStyles = makeStyles((theme) => ({
  listItem: {
    flexDirection: 'column',
    padding: 0,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.dark,
    },
  },
}));

/**
 * Create a customized Material UI List Item
 *
 * @param {ListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItem(props: ListItemProps): JSX.Element {
  const { children, className, style } = props;

  const classes = useStyles();

  return (
    <MaterialListItem className={`${classes.listItem} ${className || ''}`} style={style || undefined}>
      {children !== undefined && children}
    </MaterialListItem>
  );
}
