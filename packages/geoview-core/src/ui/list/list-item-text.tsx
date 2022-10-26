import React from 'react';
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
export const ListItemText = React.forwardRef((props: ListItemTextProps, ref): JSX.Element => {
  return <MaterialListItemText ref={ref} {...props} />;
});
