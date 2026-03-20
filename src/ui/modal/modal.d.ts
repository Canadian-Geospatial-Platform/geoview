import type { CSSProperties, ReactNode } from 'react';
import type { DialogProps } from '@mui/material';
/**
 * Properties for the Modal component extending Material-UI's DialogProps
 */
interface DialogPropsExtend extends Omit<DialogProps, 'title'> {
    modalId: string;
    modalProps?: TypeModalProps;
    className?: string;
    style?: CSSProperties;
    title?: ReactNode;
    titleId?: string;
    contentModal?: ReactNode;
    contentClassName?: string;
    contentStyle?: CSSProperties;
    contentTextId?: string;
    contentTextClassName?: string;
    contentTextStyle?: CSSProperties;
    actions?: ReactNode;
    onClose?: () => void;
    width?: string | number;
    height?: string | number;
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
    modalId?: string;
    header?: ModalHeader;
    content: ReactNode | string;
    footer?: ModalFooter;
    active?: boolean;
    open?: () => void;
    close?: () => void;
    width?: string | number;
    height?: string | number;
};
/**
 * Modal header properties interface
 */
export interface ModalHeader {
    title: string | undefined;
    actions?: Array<ModalActionsType>;
}
/**
 * Modal footer properties interface
 */
export interface ModalFooter {
    actions?: Array<ModalActionsType>;
}
/**
 * Both header and footer actions' properties interface
 */
export interface ModalActionsType {
    actionId: string;
    content?: ReactNode;
}
/**
 * Material-UI Dialog-based Modal component with header, content, and footer sections.
 *
 * Wraps Material-UI's Dialog to provide enhanced modal dialog with configurable
 * header (title + actions), content area, and footer (actions). Supports fade
 * animation, custom closing behavior, and flexible content rendering (HTML strings
 * or JSX). All Material-UI Dialog props are supported and passed through directly.
 *
 * @param props - Modal configuration (see DialogPropsExtend interface)
 * @returns Modal component with structured header, content, and footer layout
 *
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
 * @see {@link https://mui.com/material-ui/react-dialog/}
 */
declare function ModalUI(props: DialogPropsExtend): JSX.Element;
export declare const Modal: typeof ModalUI;
export {};
//# sourceMappingURL=modal.d.ts.map