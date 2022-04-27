/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';

import { InputAdornment, TextField as MaterialTextField } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import { TypeTextFieldProps } from '../../core/types/cgpv-types';

const useStyles = makeStyles((theme) => ({
  textField: {
    width: '50%',
    margin: '10px 0',
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiOutlinedInput-root.Mui-focused': {
      border: `1px solid ${theme.palette.primary.contrastText}`,
    },
  },
}));

/**
 * Create a customizable Material UI TextField
 *
 * @param {TypeTextFieldProps} props the properties passed to the TextField component
 * @returns {JSX.Element} the created TextField element
 */
export function TextField(props: TypeTextFieldProps): JSX.Element {
  const classes = useStyles();

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

  return (
    <MaterialTextField
      className={`${classes.textField} ${className && className}`}
      style={style}
      value={defaultValue ? undefined : value}
      onChange={changeHandler}
      inputRef={inputRef || undefined}
      InputProps={{
        startAdornment: prefix && <InputAdornment position="start">{prefix}</InputAdornment>,
        endAdornment: suffix && <InputAdornment position="end">{suffix}</InputAdornment>,
      }}
      helperText={helperText && !error ? helperText || undefined : (error && errorHelpertext) || undefined}
      {...otherProps}
    />
  );
}
