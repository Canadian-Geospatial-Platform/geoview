/* eslint-disable react/require-default-props */
/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback, Fragment, CSSProperties, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { ClassNameMap } from '@mui/styles';
import withStyles from '@mui/styles/withStyles';
import makeStyles from '@mui/styles/makeStyles';

import { Dialog, DialogActions, DialogContent, DialogProps, DialogTitle } from '@mui/material';

import { TypeJsonObject } from '@/core/types/global-types';
import { HtmlToReact } from '@/core/containers/html-to-react';

import { EVENT_NAMES } from '@/api/events/event-types';
import { api } from '@/app';

import { TypeModalProps } from '.';
import { CloseIcon, IconButton } from '..';
import { PayloadBaseClass, payloadIsAModal } from '@/api/events/payloads';

/**
 * Customized Material UI Dialog Properties
 */
interface TypeDialogProps extends Omit<DialogProps, 'title'> {
  modalId?: string;

  // custom dialog classes and styles
  className?: string;
  style?: CSSProperties;

  // custom title
  title?: ReactNode;
  titleId?: string;

  // dialog content and content styling
  contentModal?: ReactNode;
  contentClassName?: string;
  contentStyle?: CSSProperties;

  // dialog text content container styling
  contentTextId?: string;
  contentTextClassName?: string;
  contentTextStyle?: CSSProperties;

  // action elements / buttons
  actions?: ReactNode;

  // id of the map that is using this modal
  mapId: string;
}

const useStyles = makeStyles((theme) => ({
  dialog: {
    position: 'absolute',
    "& ~ & > div[class*='backdrop']": {
      backgroundColor: 'transparent',
    },
  },
  backdrop: {
    position: 'absolute',
    background: theme.palette.backdrop,
  },
  content: {
    padding: theme.spacing(5, 0),
    whiteSpace: 'pre-line',
  },
  modalTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 10px',
  },
  modalTitleLabel: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  modalTitleActions: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  headerActionsContainer: {
    display: 'flex',
    padding: '5px 10px',
    '& > *:not(:last-child)': {
      marginRight: theme.spacing(3),
    },
  },
  closedModal: {
    display: 'none',
  },
  createdAction: {
    width: `30%`,
    alignSelf: 'flex-end',
    '& > * ': {
      textAlign: 'center',
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
    modalId,
    title,
    titleId,
    className,
    style,
    container,
    open,
    actions,
    fullScreen,
    contentModal,
    contentClassName,
    contentStyle,
    contentTextId,
    contentTextClassName,
    contentTextStyle,
    mapId,
    'aria-labelledby': ariaLabeledBy,
    'aria-describedby': ariaDescribedBy,
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
        maxWidth: 'none',
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
                  if (typeof action.content === 'string') {
                    return (
                      <Fragment key={action.actionId}>
                        <HtmlToReact
                          extraOptions={{ id: action.actionId as TypeJsonObject } as TypeJsonObject}
                          htmlContent={action.content}
                        />
                      </Fragment>
                    );
                  }
                  return <Fragment key={action.actionId}>{action.content}</Fragment>;
                })}
              </div>
            ) : null}
            <IconButton
              id={`${modalId}-close-button`}
              tooltip={t('close')!}
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
            {typeof modal.content === 'string' ? <HtmlToReact htmlContent={modal.content} /> : modal.content}
          </div>
        </DialogContent>
        {modal.footer?.actions && modal.footer?.actions.length >= 1 ? (
          <DialogActions>
            {modal.footer?.actions.map((action) => {
              if (typeof action.content === 'string') {
                return (
                  <Fragment key={action.actionId}>
                    <HtmlToReact extraOptions={{ id: action.actionId as TypeJsonObject } as TypeJsonObject} htmlContent={action.content} />
                  </Fragment>
                );
              }
              return <Fragment key={action.actionId}>{action.content}</Fragment>;
            }) || null}
          </DialogActions>
        ) : null}
      </Dialog>
    ));

    return <CustomDialog />;
  };

  const modalOpenListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAModal(payload)) {
      if (modalId === payload.modalId) {
        const modal = api.maps[mapId].modal.modals[payload.modalId] as TypeModalProps;
        openEvent = true;

        setCreatedModal(ceatedModalJSXReturner(modal));
      }
    }
  };

  const modalUpdateListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAModal(payload)) {
      if (modalId === payload.modalId) {
        const modal = api.maps[mapId].modal.modals[payload.modalId] as TypeModalProps;

        setCreatedModal(ceatedModalJSXReturner(modal));
      }
    }
  };

  const modalCloseListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAModal(payload)) {
      if (modalId === payload.modalId) {
        if (!payload.open) openEvent = false;
        setCreatedModal(<Dialog open={openEvent} className={dialogClasses.closedModal} />);
      }
    }
  };

  useEffect(() => {
    // to open the modal
    api.event.on(EVENT_NAMES.MODAL.EVENT_MODAL_OPEN, modalOpenListenerFunction, mapId);

    // to update modals
    api.event.on(EVENT_NAMES.MODAL.EVENT_MODAL_UPDATE, modalUpdateListenerFunction, mapId);

    // to close the modal
    api.event.on(EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE, modalCloseListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.MODAL.EVENT_MODAL_OPEN, mapId, modalOpenListenerFunction);
      api.event.off(EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE, mapId, modalCloseListenerFunction);
      api.event.off(EVENT_NAMES.MODAL.EVENT_MODAL_UPDATE, mapId, modalUpdateListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateModal, createdModal]);

  return (
    createdModal || (
      <Dialog
        open={open || openEvent}
        className={`${dialogClasses.dialog} ${className && className}`}
        style={{ ...style, position: 'absolute' }}
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
            {contentModal}
          </div>
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    )
  );
}
