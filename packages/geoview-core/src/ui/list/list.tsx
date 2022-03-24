import { CSSProperties } from 'react';

import { List as MaterialList } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

const useStyles = makeStyles((theme) => ({
  list: {
    padding: 0,
  },
}));

/**
 * Properties for the List UI
 */
interface ListProps {
  children?: JSX.Element | (JSX.Element | null)[] | JSX.Element[];
  type?: 'ul' | 'ol';
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/**
 * Create a customized Material UI List
 *
 * @param {ListProps} props the properties passed to the List element
 * @returns {JSX.Element} the created List element
 */
export function List(props: ListProps) {
  const { children, className, style, type } = props;

  const classes = useStyles();

  return (
    <MaterialList className={`${classes.list} ${className || ''}`} style={style || undefined} component={type || 'ul'}>
      {children !== undefined && children}
    </MaterialList>
  );
}
