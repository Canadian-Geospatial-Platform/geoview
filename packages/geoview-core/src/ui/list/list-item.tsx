import { CSSProperties } from "react";

import { ListItem as MaterialListItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

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

interface ListItemProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: TypeChildren;
}

export const ListItem = (props: ListItemProps) => {
  const { children, className, style } = props;

  const classes = useStyles();

  return (
    <MaterialListItem className={classes.listItem}>
      {children !== undefined && children}
    </MaterialListItem>
  );
};
