import { List as MaterialList } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import { TypeListProps } from '../../core/types/cgpv-types';

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
