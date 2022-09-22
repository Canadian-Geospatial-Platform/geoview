import MaterialList from '@mui/material/List';
import makeStyles from '@mui/styles/makeStyles';

import { ListProps } from '@mui/material';

/**
 * Properties for the List UI
 */
export interface TypeListProps extends ListProps {
  // eslint-disable-next-line react/require-default-props
  type?: 'ul' | 'ol';
}

const useStyles = makeStyles(() => ({
  list: {
    padding: 0,
  },
}));

/**
 * Create a customized Material UI List
 *
 * @param {TypeListProps} props the properties passed to the List element
 * @returns {JSX.Element} the created List element
 */
export function List(props: TypeListProps): JSX.Element {
  const { children, className, style, type } = props;

  const classes = useStyles();

  return (
    <MaterialList className={`${classes.list} ${className || ''}`} style={style || undefined} component={type || 'ul'}>
      {children !== undefined && children}
    </MaterialList>
  );
}
