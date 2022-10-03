/// <reference types="react" />
import { TextFieldProps } from '@mui/material';
/**
 * Custom Material UI Textfield properties
 */
declare type TypeTextFieldProps = TextFieldProps & {
    mapId?: string;
};
/**
 * Create a Material UI TextField component
 *
 * @param {TypeTextFieldProps} props custom textfield properties
 * @returns {JSX.Element} the text field ui component
 */
export declare function TextField(props: TypeTextFieldProps): JSX.Element;
export {};
