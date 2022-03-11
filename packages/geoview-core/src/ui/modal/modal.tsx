import React, { CSSProperties, useState, useEffect, useCallback } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps as MaterialDialogProps,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

import { TypeChildren } from "../../core/types/cgpv-types";

import { EVENT_NAMES } from "../../api/event";
import { api } from "../../api/api";

import { TypeModalProps } from ".";
import { CloseIcon, IconButton, TextField, Stepper, Select } from "..";
import { Search } from "@mui/icons-material";

const useStyles = makeStyles((theme) => ({
  dialog: {
    position: "absolute",
    "& ~ & > div[class*='backdrop']": {
      backgroundColor: "transparent",
    },
  },
  backdrop: {
    position: "absolute",
    background: theme.palette.backdrop,
  },
  content: {
    padding: theme.spacing(6, 0),
  },
  modalTitleContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitleActions: {
    justifyContent: "flex-end",
  },
  headerActionsContainer: {
    display: "flex",
    alignItems: "center",
    padding: "16px 0 16px 24px",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(3),
    },
  },
  closedModal: {
    display: "none",
  },
  createdAction: {
    width: `30%`,
    alignSelf: "flex-end",
    "& > * ": {
      textAlign: "center",
    },
  },
}));

/**
 * Customized Material UI Dialog Properties
 */
interface DialogProps extends Omit<MaterialDialogProps, "title"> {
  id?: string;

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

  // id of the map that is using this modal
  mapId: string;
}

/**
 * Create a customized Material UI Dialog
 *
 * @param {DialogProps} props the properties passed to the Dialog element
 * @returns {JSX.Element} the created Dialog element
 */
export const Modal = (props: DialogProps): JSX.Element => {
  const [createdModal, setCreatedModal] = useState<JSX.Element>();
  const [update, setUpdate] = useState<number>(0);

  let openEvent = false;
  const classes = useStyles();
  const {
    id,
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
    mapId,
  } = props;

  /**
   * Causes the modal to re-render
   */
  const updateModal = useCallback(() => {
    setUpdate((prevState) => {
      return ++prevState;
    });
  }, [update]);

  /**
   * to return the updated / newly-created modal
   *
   * @param { TypeModalProps } modal the object with modal properties
   * @returns { JSX.Element } JSX for the newly created / updated modal
   */
  const ceatedModalJSXReturner = (modal: TypeModalProps) => (
    <Dialog
      open={openEvent}
      onClose={modal.close}
      container={document.querySelector(`#${modal.mapId}`)}
      className={`${classes.dialog} ${className && className}`}
      aria-labelledby={props["aria-labelledby"]}
      aria-describedby={props["aria-describedby"]}
      fullScreen={fullScreen}
      BackdropProps={{ classes: { root: classes.backdrop } }}
    >
      <div
        className={`${classes.modalTitleContainer} ${
          modal.header?.title || classes.modalTitleActions
        }`}
      >
        {modal.header?.title ? (
          <DialogTitle>{modal.header?.title}</DialogTitle>
        ) : null}
        {modal.header?.actions !== undefined &&
        modal.header?.actions.length >= 1 ? (
          <div className={classes.headerActionsContainer}>
            {modal.header?.actions.map((action) => {
              if (typeof action.content === "string") {
                return (
                  <div
                    key={action.id}
                    id={action.id}
                    dangerouslySetInnerHTML={{
                      __html: `${action.content}`,
                    }}
                  ></div>
                );
              } else return action.content;
            })}
            <IconButton id={`${id}-close-button`} onClick={modal.close}>
              <CloseIcon />
            </IconButton>
          </div>
        ) : null}
      </div>
      <DialogContent>
        <div
          id={contentTextId}
          className={`${classes.content} ${
            contentTextClassName && contentTextClassName
          }`}
          style={contentTextStyle}
          dangerouslySetInnerHTML={{
            __html: `${modal.content}`,
          }}
        ></div>
      </DialogContent>
      {modal.footer?.actions && modal.footer?.actions.length >= 1 ? (
        <DialogActions>
          {modal.footer?.actions.map((action) => {
            if (typeof action.content === "string") {
              return (
                <div
                  key={action.id}
                  id={action.id}
                  dangerouslySetInnerHTML={{
                    __html: `${action.content}`,
                  }}
                ></div>
              );
            } else return action.content;
          }) || null}
        </DialogActions>
      ) : null}
    </Dialog>
  );

  useEffect(() => {
    // to open the modal
    api.event.on(
      EVENT_NAMES.EVENT_MODAL_OPEN,
      (args) => {
        if (id === args.id && args.handlerName === mapId) {
          const modal = api.map(mapId).modal.modals[args.id] as TypeModalProps;
          openEvent = true;

          setCreatedModal(ceatedModalJSXReturner(modal));
        }
      },
      mapId
    );

    // to update modals
    api.event.on(
      EVENT_NAMES.EVENT_MODAL_UPDATE,
      (args) => {
        if (id === args.id && args.handlerName === mapId) {
          const modal = api.map(mapId).modal.modals[args.id] as TypeModalProps;
          setCreatedModal(ceatedModalJSXReturner(modal));
        }
      },
      mapId
    );

    // to close the modal
    api.event.on(
      EVENT_NAMES.EVENT_MODAL_CLOSE,
      (args) => {
        if (id === args.id && args.handlerName === mapId) {
          if (!args.open) openEvent = false;
          setCreatedModal(
            <Dialog open={openEvent} className={classes.closedModal}></Dialog>
          );
        }
      },
      mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.EVENT_MODAL_OPEN, mapId);
      api.event.off(EVENT_NAMES.EVENT_MODAL_CLOSE, mapId);
      api.event.off(EVENT_NAMES.EVENT_MODAL_UPDATE, mapId);
    };
  }, [updateModal]);

  return createdModal ? (
    createdModal
  ) : (
    <Dialog
      open={open || openEvent}
      className={`${classes.dialog} ${className && className}`}
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
        <div
          id={contentTextId}
          className={`${classes.content} ${
            contentTextClassName && contentTextClassName
          }`}
          style={contentTextStyle}
        >
          <TextField
            id="text-1"
            label="Test label"
            placeholder="this is placeholder"
            // readonly
            // disabled
            variant="filled"
            defaultValue="def Value"
            error
            helperText="Helper text"
            suffix={
              <IconButton>
                <Search></Search>
              </IconButton>
            }
          ></TextField>

          <Select
            id="Select-1"
            label="Select any one"
            multiple
            selectItems={[
              //  default and disabled not working ATM
              { id: "option-1", value: "Option 1", default: true },
              { id: "option-2", value: "Option 2" },
              { id: "option-3", value: "Option 3" },
            ]}
          ></Select>

          <Stepper
            id="stepper-1"
            // description as JSX Element or HTML
            steps={[
              { label: "1st Step", description: "This is the First Step" },
              { label: "2nd Step", description: "Container for Second Step" },
              { label: "3rd Step", description: "Last step is the Third Step" },
            ]}
            orientation="horizontal"
            // buttonedLabels not working
            buttonedLabels
            // alternativeLabel
          ></Stepper>
          {content}
        </div>
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
};
