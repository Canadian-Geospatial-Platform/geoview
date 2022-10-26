import MaterialListItemText from '@mui/material/ListItemText';
import makeStyles from '@mui/styles/makeStyles';

import { ListItemTextProps } from '@mui/material';

const useStyles = makeStyles((theme) => ({
  listItemText: {
    //
  },
}));

/**
 * Create a customized Material UI List Item Text
 *
 * @param {ListItemTextProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItemText(props: ListItemTextProps): JSX.Element {
  const { children, className, style, primaryTypographyProps, primary } = props;

  const classes = useStyles();

  return (
    <MaterialListItemText
      className={`${classes.listItemText} ${className || ''}`}
      style={style || undefined}
      primaryTypographyProps={primaryTypographyProps}
      primary={primary}
    >
      {children !== undefined && children}
    </MaterialListItemText>
  );
}
