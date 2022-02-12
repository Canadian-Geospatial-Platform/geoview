import { CSSProperties } from "react";

import { ListItem as MaterialListItem } from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';

import { TypeChildren } from "../../core/types/cgpv-types";

const useStyles = makeStyles((theme) => ({
  listItem: {
    flexDirection: "column",
    padding: 0,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.dark,
    },
  },
}));

/**
 * List item properties
 */
interface ListItemProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: TypeChildren;
}

/**
 * Create a customized Material UI List Item
 *
 * @param {ListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export const ListItem = (props: ListItemProps) => {
  const { children, className, style } = props;

  const classes = useStyles();

  return (
    <MaterialListItem className={`${classes.listItem} ${className ? className : ''}`} style={style ? style : undefined}>
      {children !== undefined && children}
    </MaterialListItem>
  );
};
