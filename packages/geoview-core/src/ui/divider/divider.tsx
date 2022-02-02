import { CSSProperties } from "react";

import { Divider as MaterialDivider } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  vertical: {
    alignSelf: "center",
    height: 40,
    width: 1,
  },
  horizontal: {
    height: 1,
  },
  grow: {
    flexGrow: 1,
    backgroundColor: theme.palette.primary.main,
  },
}));

interface DividerProps {
  className?: string;
  style?: CSSProperties;
  orientation?: "horizontal" | "vertical";
  grow?: boolean;
}

export const Divider = (props: DividerProps): JSX.Element => {
  const { className, style, grow, orientation } = props;

  const classes = useStyles();

  return (
    <MaterialDivider
      className={
        (orientation !== undefined
          ? orientation === "horizontal"
            ? classes.horizontal
            : classes.vertical
          : classes.horizontal) +
        " " +
        (grow !== undefined && grow ? classes.grow : "") +
        " " +
        (className !== undefined ? className : "")
      }
      style={style}
    />
  );
};
