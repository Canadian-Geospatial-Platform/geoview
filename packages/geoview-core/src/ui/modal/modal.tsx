import React, {
  CSSProperties,
  useState,
  useEffect,
  useCallback,
  Fragment,
} from "react";

import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps as MaterialDialogProps,
} from "@mui/material";
import { ClassNameMap, withStyles } from "@mui/styles";
import makeStyles from "@mui/styles/makeStyles";

import { TypeChildren } from "../../core/types/cgpv-types";
import { HtmlToReact } from "../../core/containers/html-to-react";

import { EVENT_NAMES } from "../../api/event";
import { api } from "../../api/api";

import { TypeModalProps } from ".";
import { CloseIcon, IconButton } from "..";

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
    padding: theme.spacing(5, 0),
  },
  modalTitleContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "5px 10px",
  },
  modalTitleLabel: {
    display: "flex",
    justifyContent: "flex-start",
  },
  modalTitleActions: {
    display: "flex",
    justifyContent: "flex-end",
  },
  headerActionsContainer: {
    display: "flex",
    padding: "5px 10px",
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

  const { t } = useTranslation();

  let openEvent = false;
  const dialogClasses = useStyles();
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
  const ceatedModalJSXReturner = (modal: TypeModalProps): JSX.Element => {
    const CustomDialog = withStyles({
      dialogContent: {
        width: modal.width,
        height: modal.height,
        maxWidth: "none",
      },
    })(({ classes }: { classes: ClassNameMap }) => (
      <Dialog
        open={openEvent}
        onClose={modal.close}
        container={document.querySelector(`#${modal.mapId}`)}
        className={`${dialogClasses.dialog} ${className && className}`}
        classes={{
          paper: classes.dialogContent,
        }}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        fullScreen={fullScreen}
        BackdropProps={{ classes: { root: dialogClasses.backdrop } }}
      >
        <div className={dialogClasses.modalTitleContainer}>
          {modal.header?.title ? (
            <DialogTitle className={dialogClasses.modalTitleLabel}>
              {modal.header?.title}
            </DialogTitle>
          ) : null}
          <div className={dialogClasses.modalTitleActions}>
            {modal.header?.actions !== undefined &&
            modal.header?.actions.length >= 1 ? (
              <div className={dialogClasses.headerActionsContainer}>
                {modal.header?.actions.map((action) => {
                  if (typeof action.content === "string") {
                    return (
                      <Fragment key={action.id}>
                        <HtmlToReact
                          extraOptions={{
                            id: action.id,
                          }}
                          htmlContent={action.content}
                        />
                      </Fragment>
                    );
                  } else
                    return (
                      <Fragment key={action.id}>{action.content}</Fragment>
                    );
                })}
              </div>
            ) : null}
            <IconButton
              id={`${id}-close-button`}
              tooltip={t("close")}
              tooltipPlacement="right"
              onClick={modal.close}
              className={classes.headerActionsContainer}
            >
              <CloseIcon />
            </IconButton>
          </div>
        </div>
        <DialogContent>
          <div
            id={contentTextId}
            className={`${dialogClasses.content} ${
              contentTextClassName && contentTextClassName
            }`}
            style={contentTextStyle}
          >
            {typeof modal.content === "string" ? (
              <HtmlToReact htmlContent={modal.content} />
            ) : (
              modal.content
            )}
          </div>
        </DialogContent>
        {modal.footer?.actions && modal.footer?.actions.length >= 1 ? (
          <DialogActions>
            {modal.footer?.actions.map((action) => {
              if (typeof action.content === "string") {
                return (
                  <Fragment key={action.id}>
                    <HtmlToReact
                      extraOptions={{
                        id: action.id,
                      }}
                      htmlContent={action.content}
                    />
                  </Fragment>
                );
              } else
                return <Fragment key={action.id}>{action.content}</Fragment>;
            }) || null}
          </DialogActions>
        ) : null}
      </Dialog>
    ));

    return <CustomDialog />;
  };

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

          console.log(modal.content);

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
            <Dialog
              open={openEvent}
              className={dialogClasses.closedModal}
            ></Dialog>
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
  }, [updateModal, createdModal]);

  return createdModal ? (
    createdModal
  ) : (
    <Dialog
      open={open || openEvent}
      className={`${dialogClasses.dialog} ${className && className}`}
      style={{ ...style, position: "absolute" }}
      aria-labelledby={props["aria-labelledby"]}
      aria-describedby={props["aria-describedby"]}
      fullScreen={fullScreen}
      BackdropProps={{
        classes: { root: dialogClasses.backdrop },
      }}
      container={container}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent className={contentClassName} style={contentStyle}>
        <div
          id={contentTextId}
          className={`${dialogClasses.content} ${
            contentTextClassName && contentTextClassName
          }`}
          style={contentTextStyle}
        >
          {content}
        </div>
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
};
