/* eslint-disable react/require-default-props */
import { Fragment, CSSProperties, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { ClassNameMap } from '@mui/styles';
import withStyles from '@mui/styles/withStyles';
import { useTheme } from '@mui/material/styles';
import { Box, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle } from '@mui/material';

import { animated } from '@react-spring/web';
import { TypeJsonObject } from '@/core/types/global-types';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { logger } from '@/core/utils/logger';

import { CloseIcon, IconButton } from '..';
import { getSxClasses } from './modal-style';
import { useFadeIn } from '@/core/utils/useSpringAnimations';

/**
 * Customized Material UI Dialog Properties
 */
interface TypeDialogProps extends Omit<DialogProps, 'title'> {
  modalId: string;
  modalProps?: TypeModalProps;

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

  container?: Element;
  open: boolean;
  fullScreen?: boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

/**
 * Properties definition of the modal
 */
export type TypeModalProps = {
  // id of the modal. Must be unique. If not provided, it will be generated
  modalId?: string;

  // header of modal. Contains heading (title) of modal and/or action buttons, if provided. If header is not provided, modal will have no header content
  header?: ModalHeader;

  // content (description) of the modal. The HTML passed will be displayed inside a <div> element
  content: ReactNode | string;

  // footer object for the modal. Can contain buttons list as an array of JSX elements. If none provided, there will be no action buttons or footer
  footer?: ModalFooter;

  // boolean condition to check if modal is active (open) or not
  active?: boolean;

  // function that opens a modal
  open?: () => void;

  // function that closes a modal
  close?: () => void;

  // width of the modal
  width?: string | number;

  // height of the modal
  height?: string | number;
};

/**
 * Modal header properties interface
 */
export interface ModalHeader {
  // the heading (title) of modal. MUI places heading inside <h2> element
  title: string | undefined;

  // for the action buttons like close, back etc. Must be an array of objects with 'id' and 'content'
  actions?: Array<ModalActionsType>;
}

/**
 * Modal footer properties interface
 */
export interface ModalFooter {
  // the action buttons in footer of the modal. Must be an array
  actions?: Array<ModalActionsType>;
}

/**
 * Both header and footer actions' properties interface
 */
export interface ModalActionsType {
  // the id of the action (button)
  actionId: string;

  // content is the action itself, HTML (in the form of a string) or JSX
  content?: ReactNode;
}

/**
 * Create a customized Material UI Dialog
 *
 * @param {TypeDialogProps} props the properties passed to the Dialog element
 * @returns {JSX.Element} the created Dialog element
 */
export function Modal(props: TypeDialogProps): JSX.Element {
  // Log
  logger.logTraceRender('ui/modal/modal', props);

  const {
    modalId,
    modalProps,
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
    'aria-labelledby': ariaLabeledBy,
    'aria-describedby': ariaDescribedBy,
  } = props;

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  const fadeInAnimation = useFadeIn();
  const AnimatedDialog = animated(Dialog);

  /**
   * to return the updated / newly-created modal
   *
   * @param { TypeModalProps } modal the object with modal properties
   * @returns { JSX.Element } JSX for the newly created / updated modal
   */
  const createdModalJSXReturner = (modal: TypeModalProps): JSX.Element => {
    const CustomDialog = withStyles({
      dialogContent: {
        width: modal.width,
        height: modal.height,
        maxWidth: 'none',
      },
      // eslint-disable-next-line react/no-unused-prop-types
    })(({ classes }: { classes: ClassNameMap }) => (
      <AnimatedDialog
        open={open}
        onClose={modal.close}
        container={container}
        style={fadeInAnimation}
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
          <Box
            component="div"
            id={contentTextId}
            className={`${sxClasses.content} ${contentTextClassName && contentTextClassName}`}
            style={contentTextStyle}
          >
            {typeof modal.content === 'string' ? <HtmlToReact htmlContent={modal.content} /> : modal.content}
          </Box>
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
      </AnimatedDialog>
    ));

    return <CustomDialog />;
  };

  return (
    (modalProps && createdModalJSXReturner(modalProps)) || (
      <Dialog
        open={open}
        sx={sxClasses.dialog}
        className={`${className && className}`}
        style={{ ...style, position: 'fixed' }}
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
