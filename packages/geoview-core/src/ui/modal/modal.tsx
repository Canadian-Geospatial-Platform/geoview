/* eslint-disable react/require-default-props */
import { Fragment, CSSProperties, ReactNode, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ClassNameMap } from '@mui/styles';
import withStyles from '@mui/styles/withStyles';
import { useTheme } from '@mui/material/styles';
import { Box, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle } from '@mui/material';

import { animated } from '@react-spring/web';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';

import { IconButton } from '@/ui/icon-button/icon-button';
import { CloseIcon } from '@/ui/icons/index';
import { getSxClasses } from '@/ui/modal/modal-style';
import { useFadeIn } from '@/core/utils/useSpringAnimations';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Modal component extending Material-UI's DialogProps
 */

interface DialogPropsExtend extends Omit<DialogProps, 'title'> {
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
 * Create a customized Material UI Modal component.
 * This component extends the Material-UI Dialog to provide enhanced modal functionality
 * with support for headers, content, and footer actions.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Modal
 *   modalId="basic-modal"
 *   open={isOpen}
 *   title="Modal Title"
 *   contentModal={<div>Modal content</div>}
 * />
 *
 * // With custom header and footer actions
 * <Modal
 *   modalId="custom-modal"
 *   modalProps={{
 *     header: {
 *       title: "Custom Header",
 *       actions: [{ actionId: "close", content: <CloseButton /> }]
 *     },
 *     content: "Modal content",
 *     footer: {
 *       actions: [
 *         { actionId: "cancel", content: <Button>Cancel</Button> },
 *         { actionId: "save", content: <Button>Save</Button> }
 *       ]
 *     }
 *   }}
 *   open={isOpen}
 * />
 *
 * // With custom styling
 * <Modal
 *   modalId="styled-modal"
 *   className="custom-modal"
 *   contentClassName="modal-content"
 *   open={isOpen}
 *   title="Styled Modal"
 * />
 * ```
 *
 * @param {DialogPropsExtend} props - The properties passed to the Modal element
 * @returns {JSX.Element} The Modal component
 *
 * @see {@link https://mui.com/material-ui/react-dialog/|Material-UI Dialog}
 */
function ModalUI(props: DialogPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/modal/modal');

  // Get constant from props
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

  // Hooks
  // TODO: remove coupling with translation, pass as props
  // TODO: refactor - language values should be pass as props
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);
  const fadeInAnimation = useFadeIn();
  const AnimatedDialog = animated(Dialog);

  /**
   * to return the updated / newly-created modal
   *
   * @param { TypeModalProps } modal the object with modal properties
   * @returns { JSX.Element } JSX for the newly created / updated modal
   */
  const createdModal = (modal: TypeModalProps): JSX.Element => {
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
                        <UseHtmlToReact
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
            {typeof modal.content === 'string' ? <UseHtmlToReact htmlContent={modal.content} /> : modal.content}
          </Box>
        </DialogContent>
        {modal.footer?.actions && modal.footer?.actions.length >= 1 ? (
          <DialogActions>
            {modal.footer?.actions.map((action) => {
              if (typeof action.content === 'string') {
                return (
                  <Fragment key={action.actionId}>
                    <UseHtmlToReact
                      extraOptions={{ id: action.actionId as TypeJsonObject } as TypeJsonObject}
                      htmlContent={action.content}
                    />
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
    (modalProps && createdModal(modalProps)) || (
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

export const Modal = ModalUI;
