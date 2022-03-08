import { CSSProperties } from "react";

import makeStyles from "@mui/styles/makeStyles";
import { CircularProgress as MaterialCircularProgress } from "@mui/material";

const useStyles = makeStyles((theme) => {
  return {
    loading: {
      position: "absolute",
      top: "0px",
      bottom: "0px",
      left: "0px",
      right: "0px",
      zIndex: 10000,
      backgroundColor: "#000000",
      textAlign: "center",
      transition: theme.transitions.create(["visibility", "opacity"], {
        delay: theme.transitions.duration.shortest,
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.splash,
      }),
    },
    progress: {
      width: "100px !important",
      height: "100px !important",
      top: "50%",
      position: "absolute",
    },
  };
});

/**
 * Circular Progress Properties
 */
interface CircularProgressProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  isLoaded: boolean;
}

/**
 * Create a customized Material UI Circular Progress
 *
 * @param {CircularProgress} props the properties passed to the circular progress element
 * @returns {JSX.Element} the created Circular Progress element
 */
export const CircularProgress = (props: CircularProgressProps): JSX.Element => {
  const { className, style, isLoaded } = props;
  const classes = useStyles();

  return !isLoaded ? (
    <div
      className={`${classes.loading} ${className !== undefined && className}`}
      style={{ ...style }}
    >
      <MaterialCircularProgress className={classes.progress} />
    </div>
  ) : (
    <></>
  );
};
