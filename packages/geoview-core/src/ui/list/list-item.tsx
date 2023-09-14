import { ListItem as MaterialListItem, ListItemProps } from '@mui/material';

/**
 * Custom MUI ListItem Props
 */
interface TypeListItemProps extends ListItemProps {
  // eslint-disable-next-line react/require-default-props
  innerref?: (element: HTMLElement | null) => void;
}

const sxClasses = {
  listItem: {
    color: 'text.primary',
    padding: 0,
  },
};

/**
 * Create a customized Material UI List Item
 *
 * @param {TypeListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export function ListItem(props: TypeListItemProps): JSX.Element {
  const { children } = props;
  const { innerref, ...propsWithoutRefs } = props;

  return (
    <MaterialListItem sx={sxClasses.listItem} ref={innerref} {...propsWithoutRefs}>
      {children !== undefined && children}
    </MaterialListItem>
  );
}
