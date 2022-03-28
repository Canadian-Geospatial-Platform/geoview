import { CSSProperties } from "react";

import { Divider as MaterialDivider } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  vertical: {
    alignSelf: "center",
    height: 40,
    width: 1,
    backgroundColor: theme.palette.primary.contrastText,
  },
  horizontal: {
    height: 1,
    backgroundColor: theme.palette.primary.contrastText,
  },
  grow: {
    flexGrow: 1,
    backgroundColor: theme.palette.primary.main,
  },
}));

/**
 * Properties for the Divider
 */
interface DividerProps {
  className?: string;
  style?: CSSProperties;
  orientation?: "horizontal" | "vertical";
  grow?: boolean;
}

/**
 * Create a customized Material UI Divider
 *
 * @param {DividerProps} props the properties passed to the Divider element
 * @returns {JSX.Element} the created Divider element
 */
export function Divider(props: DividerProps): JSX.Element {
  const { className, style, grow, orientation } = props;

  const classes = useStyles();

  return (
    <MaterialDivider
      className={`${
        orientation !== undefined ? (orientation === "horizontal" ? classes.horizontal : classes.vertical) : classes.horizontal
      } ${grow !== undefined && grow ? classes.grow : ""} ${className !== undefined ? className : ""}`}
      style={style}
    />
  );
}
