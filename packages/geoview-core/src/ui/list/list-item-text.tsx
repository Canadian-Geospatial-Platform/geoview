import { forwardRef, Ref } from 'react';
import { ListItemText as MaterialListItemText, ListItemTextProps } from '@mui/material';

const typographyProps = {
  primary: {
    fontSize: 14,
    noWrap: true,
  },
};

/**
 * Create a customized Material UI List Item Text component.
 * This is a simple wrapper around MaterialListItemText that maintains
 * full compatibility with Material-UI's List Item Text props.
 *
 * @param {ListItemTextProps} props - All valid Material-UI List Item Text props
 * @param {Ref<HTMLDivElement>} ref - Reference to the underlying div element
 * @returns {JSX.Element} The List Item Text component
 */
function ListItemTextUI(props: ListItemTextProps, ref: Ref<HTMLDivElement>): JSX.Element {
  return <MaterialListItemText ref={ref} {...props} slotProps={typographyProps} />;
}

// Export the List Item Text using forwardRef so that passing ref is permitted and functional in the react standards
export const ListItemText = forwardRef<HTMLDivElement, ListItemTextProps>(ListItemTextUI);
