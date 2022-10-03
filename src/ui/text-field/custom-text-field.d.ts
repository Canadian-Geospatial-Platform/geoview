import React from 'react';
import { BaseTextFieldProps } from '@mui/material/TextField';
/**
 * Customized Material UI Custom TextField Properties
 */
interface TypeCustomTextFieldProps extends Omit<BaseTextFieldProps, 'prefix'> {
    id: string;
    errorHelpertext?: string | undefined;
    prefix?: string | JSX.Element | HTMLElement | React.ReactNode;
    suffix?: string | JSX.Element | HTMLElement | undefined;
    changeHandler?: <T>(params: T) => void;
}
/**
 * Create a customizable Material UI TextField
 *
 * @param {TypeCustomTextFieldProps} props the properties passed to the TextField component
 * @returns {JSX.Element} the created TextField element
 */
export declare function CustomTextField(props: TypeCustomTextFieldProps): JSX.Element;
export {};
