import React, { CSSProperties } from 'react';
import { DialogProps } from '@mui/material';
/**
 * Customized Material UI Dialog Properties
 */
interface TypeDialogProps extends Omit<DialogProps, 'title'> {
    modalId?: string;
    className?: string;
    style?: CSSProperties;
    title?: React.ReactNode;
    titleId?: string;
    contentModal?: React.ReactNode;
    contentClassName?: string;
    contentStyle?: CSSProperties;
    contentTextId?: string;
    contentTextClassName?: string;
    contentTextStyle?: CSSProperties;
    actions?: React.ReactNode;
    mapId: string;
}
/**
 * Create a customized Material UI Dialog
 *
 * @param {TypeDialogProps} props the properties passed to the Dialog element
 * @returns {JSX.Element} the created Dialog element
 */
export declare function Modal(props: TypeDialogProps): JSX.Element;
export {};
