import { CSSProperties, ReactNode } from 'react';
import { DialogProps } from '@mui/material';
/**
 * Customized Material UI Dialog Properties
 */
interface TypeDialogProps extends Omit<DialogProps, 'title'> {
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
 * Create a customized Material UI Dialog
 *
 * @param {TypeDialogProps} props the properties passed to the Dialog element
 * @returns {JSX.Element} the created Dialog element
 */
export declare function Modal(props: TypeDialogProps): JSX.Element;
export {};
