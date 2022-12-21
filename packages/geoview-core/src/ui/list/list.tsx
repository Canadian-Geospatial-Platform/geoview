/* eslint-disable react/require-default-props */
import MaterialList from '@mui/material/List';

import { ListProps } from '@mui/material';

/**
 * Properties for the List UI
 */
export interface TypeListProps extends ListProps {
  type?: 'ul' | 'ol';
  innerref?: (element: HTMLElement | null) => void;
}

const sxClasses = {
  list: {
    padding: 0,
  },
};

/**
 * Create a customized Material UI List
 *
 * @param {TypeListProps} props the properties passed to the List element
 * @returns {JSX.Element} the created List element
 */
export function List(props: TypeListProps): JSX.Element {
  const { children, className, style, type, sx, innerref } = props;

  return (
    <MaterialList
      ref={innerref}
      sx={{ ...sxClasses.list, ...sx }}
      className={`${className || ''}`}
      style={style || undefined}
      component={type || 'ul'}
    >
      {children !== undefined && children}
    </MaterialList>
  );
}
