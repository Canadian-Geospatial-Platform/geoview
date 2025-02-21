import { forwardRef, Ref } from 'react';
import MaterialList from '@mui/material/List';
import { ListProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

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
  },
};

/**
 * Create a customized Material UI List
 *
 * @param {TypeListProps} props the properties passed to the List element
 * @param {Ref<HTMLUListElement>} ref - Reference to the underlying lu list element
 * @returns {JSX.Element} the created List element
 */
function ListUI(props: TypeListProps, ref: Ref<HTMLUListElement>): JSX.Element {
  logger.logTraceRender('ui/list/list', props);

  // Get constant from props
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
}

// Export the List using forwardRef so that passing ref is permitted and functional in the react standards
export const List = forwardRef<HTMLUListElement, TypeListProps>(ListUI);
