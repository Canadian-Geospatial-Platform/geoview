/* eslint-disable react/require-default-props */
import { useState, useEffect, useCallback, Fragment, CSSProperties, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { ClassNameMap } from '@mui/styles';
import withStyles from '@mui/styles/withStyles';
import { useTheme } from '@mui/material/styles';
import { Box, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle } from '@mui/material';

import { TypeJsonObject } from '@/core/types/global-types';
import { HtmlToReact } from '@/core/containers/html-to-react';

import { EVENT_NAMES } from '@/api/events/event-types';
import { api } from '@/app';

import { TypeModalProps } from '.';
import { CloseIcon, IconButton } from '..';
import { PayloadBaseClass, payloadIsAModal } from '@/api/events/payloads';
import { getSxClasses } from './modal-style';
import { logger } from '@/core/utils/logger';

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

  container?: Element;
  open: boolean;
  fullScreen?: boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

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

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [createdModal, setCreatedModal] = useState<JSX.Element>();
  const [, setUpdate] = useState<number>(0);
  let openEvent = false;

  /**
   * Causes the modal to re-render
   */
  const updateModal = useCallback(() => {
    // Log
    logger.logTraceUseCallback('UI.MODAL - updateModal');

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
        sx={sxClasses.dialog}
        className={`${className && className}`}
        classes={{
          paper: classes.dialogContent,
        }}
        aria-labelledby={ariaLabeledBy}
        aria-describedby={ariaDescribedBy}
        fullScreen={fullScreen}
      >
        <Box sx={sxClasses.modalTitleContainer}>
          {modal.header?.title ? <DialogTitle sx={sxClasses.modalTitleLabel}>{modal.header?.title}</DialogTitle> : null}
          <Box sx={sxClasses.modalTitleActions}>
            {modal.header?.actions !== undefined && modal.header?.actions.length >= 1 ? (
              <Box sx={sxClasses.headerActionsContainer}>
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
              </Box>
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
          </Box>
        </Box>
        <DialogContent>
          <div
            id={contentTextId}
            className={`${sxClasses.content} ${contentTextClassName && contentTextClassName}`}
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
    // Log
    logger.logTraceCoreAPIEvent('UI.MODAL - modalOpenListenerFunction', payload);

    if (payloadIsAModal(payload)) {
      if (modalId === payload.modalId) {
        const modal = api.maps[mapId].modal.modals[payload.modalId] as TypeModalProps;
        openEvent = true;

        setCreatedModal(ceatedModalJSXReturner(modal));
      }
    }
  };

  const modalUpdateListenerFunction = (payload: PayloadBaseClass) => {
    // Log
    logger.logTraceCoreAPIEvent('UI.MODAL - modalUpdateListenerFunction', payload);

    if (payloadIsAModal(payload)) {
      if (modalId === payload.modalId) {
        const modal = api.maps[mapId].modal.modals[payload.modalId] as TypeModalProps;

        setCreatedModal(ceatedModalJSXReturner(modal));
      }
    }
  };

  const modalCloseListenerFunction = (payload: PayloadBaseClass) => {
    // Log
    logger.logTraceCoreAPIEvent('UI.MODAL - modalCloseListenerFunction', payload);

    if (payloadIsAModal(payload)) {
      if (modalId === payload.modalId) {
        if (!payload.open) openEvent = false;
        setCreatedModal(<Dialog open={openEvent} sx={sxClasses.closedModal} />);
      }
    }
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.MODAL - updateModal');

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
        sx={sxClasses.dialog}
        className={`${className && className}`}
        style={{ ...style, position: 'absolute' }}
        aria-labelledby={ariaLabeledBy}
        aria-describedby={ariaDescribedBy}
        fullScreen={fullScreen}
        container={container}
      >
        <DialogTitle id={titleId}>{title}</DialogTitle>
        <DialogContent className={contentClassName} style={contentStyle}>
          <div
            id={contentTextId}
            className={`${sxClasses.content} ${contentTextClassName && contentTextClassName}`}
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
