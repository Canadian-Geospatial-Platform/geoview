/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, Fragment } from "react";

import { useTranslation } from "react-i18next";

import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { ClassNameMap, withStyles } from "@mui/styles";
import makeStyles from "@mui/styles/makeStyles";

import { TypeDialogProps } from "../../core/types/cgpv-types";
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
 * Create a customized Material UI Dialog
 *
 * @param {TypeDialogProps} props the properties passed to the Dialog element
 * @returns {JSX.Element} the created Dialog element
 */
export function Modal(props: TypeDialogProps): JSX.Element {
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
    "aria-labelledby": ariaLabeledBy,
    "aria-describedby": ariaDescribedBy,
  } = props;

  const [createdModal, setCreatedModal] = useState<JSX.Element>();
  const [, setUpdate] = useState<number>(0);

  const { t } = useTranslation();

  let openEvent = false;
  const dialogClasses = useStyles();

  /**
   * Causes the modal to re-render
   */
  const updateModal = useCallback(() => {
    setUpdate((prevState) => {
      return 1 + prevState;
    });
  }, []);

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
      // eslint-disable-next-line react/no-unused-prop-types
    })(({ classes }: { classes: ClassNameMap }) => (
      <Dialog
        open={openEvent}
        onClose={modal.close}
        container={document.querySelector(`#${modal.mapId}`)}
        className={`${dialogClasses.dialog} ${className && className}`}
        classes={{
          paper: classes.dialogContent,
        }}
        aria-labelledby={ariaLabeledBy}
        aria-describedby={ariaDescribedBy}
        fullScreen={fullScreen}
        BackdropProps={{ classes: { root: dialogClasses.backdrop } }}
      >
        <div className={dialogClasses.modalTitleContainer}>
          {modal.header?.title ? <DialogTitle className={dialogClasses.modalTitleLabel}>{modal.header?.title}</DialogTitle> : null}
          <div className={dialogClasses.modalTitleActions}>
            {modal.header?.actions !== undefined && modal.header?.actions.length >= 1 ? (
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
                  }
                  return <Fragment key={action.id}>{action.content}</Fragment>;
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
            className={`${dialogClasses.content} ${contentTextClassName && contentTextClassName}`}
            style={contentTextStyle}
          >
            {typeof modal.content === "string" ? <HtmlToReact htmlContent={modal.content} /> : modal.content}
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
              }
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
          // eslint-disable-next-line react-hooks/exhaustive-deps
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
          setCreatedModal(<Dialog open={openEvent} className={dialogClasses.closedModal} />);
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

  return (
    createdModal || (
      <Dialog
        open={open || openEvent}
        className={`${dialogClasses.dialog} ${className && className}`}
        style={{ ...style, position: "absolute" }}
        aria-labelledby={ariaLabeledBy}
        aria-describedby={ariaDescribedBy}
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
            className={`${dialogClasses.content} ${contentTextClassName && contentTextClassName}`}
            style={contentTextStyle}
          >
            {content}
          </div>
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    )
  );
}
