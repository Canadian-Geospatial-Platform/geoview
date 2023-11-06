/* eslint-disable react/require-default-props */
/* eslint-disable react/jsx-props-no-spreading */
import React, { ReactNode } from 'react';

import { useTheme } from '@mui/material/styles';
import { BaseTextFieldProps, InputAdornment, TextField as MaterialTextField } from '@mui/material';

import { getSxClasses } from './custom-text-field-style';

/**
 * Customized Material UI Custom TextField Properties
 */
interface TypeCustomTextFieldProps extends Omit<BaseTextFieldProps, 'prefix'> {
  textFieldId: string;

  // the helper text (as defined above) but only if there is an error
  errorHelpertext?: string | undefined;

  // the HTML Element (for example, an icon) that is embedded inside the text field (left side)
  prefix?: string | JSX.Element | HTMLElement | ReactNode;

  // the HTML Element (for example, an icon) that is embedded inside the text field (right side)
  suffix?: string | JSX.Element | HTMLElement | undefined;

  // Function that handles change in input
  changeHandler?: <T>(params: T) => void;
}

/**
 * Create a customizable Material UI TextField
 *
 * @param {TypeCustomTextFieldProps} props the properties passed to the TextField component
 * @returns {JSX.Element} the created TextField element
 */
export function CustomTextField(props: TypeCustomTextFieldProps): JSX.Element {
  const {
    className,
    style,
    defaultValue,
    helperText,
    error,
    errorHelpertext,
    prefix,
    suffix,
    inputRef,
    value,
    changeHandler,
    ...otherProps
  } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return (
    <MaterialTextField
      sx={sxClasses.textField}
      className={`${className && className}`}
      style={style}
      value={defaultValue ? undefined : value}
      onChange={changeHandler}
      inputRef={inputRef || undefined}
      InputProps={{
        startAdornment: prefix && <InputAdornment position="start">{prefix as unknown as ReactNode}</InputAdornment>,
        endAdornment: suffix && <InputAdornment position="end">{suffix as unknown as ReactNode}</InputAdornment>,
      }}
      helperText={helperText && !error ? helperText || undefined : (error && errorHelpertext) || undefined}
      {...otherProps}
    />
  );
}
