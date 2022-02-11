import { CSSProperties } from "react";

import {
  Dialog as MaterialDialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  DialogProps as MaterialDialogProps,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { TypeChildren } from "../../core/types/cgpv-types";

const useStyles = makeStyles((theme) => ({
  dialog: {
    position: "absolute",
  },
  backdrop: {
    position: "absolute",
    background: theme.palette.backdrop,
  },
  content: {
    padding: theme.spacing(5),
  },
}));

/**
 * Customized Material UI Dialog Properties
 */
interface DialogProps extends Omit<MaterialDialogProps, "title"> {
  // custom dialog classes and styles
  className?: string;
  style?: CSSProperties;

  // custom title
  title?: TypeChildren;
  titleId?: string;

  // dialog content and content styling
  content?: TypeChildren;
  contentClassName?: string;
  contentStyle?: CSSProperties;

  // dialog text content container styling
  contentTextId?: string;
  contentTextClassName?: string;
  contentTextStyle?: CSSProperties;

  // action elements / buttons
  actions?: TypeChildren;
}

/**
 * Create a customized Material UI Dialog
 *
 * @param {DialogProps} props the properties passed to the Dialog element
 * @returns {JSX.Element} the created Dialog element
 */
export const Dialog = (props: DialogProps): JSX.Element => {
  const {
    title,
    titleId,
    className,
    style,
    container,
    open,
    actions,
    fullScreen,
    content,
    contentClassName,
    contentStyle,
    contentTextId,
    contentTextClassName,
    contentTextStyle,
  } = props;

  const classes = useStyles();

  return (
    <MaterialDialog
      open={open}
      className={classes.dialog + " " + (className && className)}
      style={{ ...style, position: "absolute" }}
      aria-labelledby={props["aria-labelledby"]}
      aria-describedby={props["aria-describedby"]}
      fullScreen={fullScreen}
      BackdropProps={{
        classes: { root: classes.backdrop },
      }}
      container={container}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent className={contentClassName} style={contentStyle}>
        <DialogContentText
          id={contentTextId}
          className={
            classes.content +
            " " +
            (contentTextClassName && contentTextClassName)
          }
          style={contentTextStyle}
        >
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </MaterialDialog>
  );
};
