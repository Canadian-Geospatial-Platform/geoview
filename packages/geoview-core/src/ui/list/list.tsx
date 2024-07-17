/* eslint-disable react/require-default-props */
import MaterialList from '@mui/material/List';

import { ListProps } from '@mui/material';
import React from 'react';

/**
 * Properties for the List UI
 */
export interface TypeListProps extends ListProps {
  type?: 'ul' | 'ol';
}

const sxClasses = {
  list: {
    padding: 0,
    width: '100%',
    // maxWidth: 350, // for testing panel width
  },
};

/**
 * Create a customized Material UI List
 *
 * @param {TypeListProps} props the properties passed to the List element
 * @returns {JSX.Element} the created List element
 */
export const List = React.forwardRef<HTMLUListElement, TypeListProps>((props: TypeListProps, ref): JSX.Element => {
  const { children, className, style, type, sx, ...rest } = props;

  return (
    <MaterialList
      ref={ref}
      sx={{ ...sxClasses.list, ...sx }}
      className={className || ''}
      style={style || undefined}
      component={type || 'ul'}
      {...rest}
    >
      {children !== undefined && children}
    </MaterialList>
  );
});

List.displayName = 'List';
