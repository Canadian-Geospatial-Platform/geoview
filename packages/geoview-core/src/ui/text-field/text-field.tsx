import React, { CSSProperties } from 'react';

import { BaseTextFieldProps, InputAdornment, TextField as MaterialTextField } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

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
 * Customized Material UI TextField Properties
 */
interface TextFieldProps extends BaseTextFieldProps {
  id: string;
  className?: string;
  style?: CSSProperties;

  // the helper text (as defined above) but only if there is an error
  errorHelpertext?: string | undefined;

  // the HTML Element (for example, an icon) that is embedded inside the text field (left side)
  prefix?: string | JSX.Element | HTMLElement | any;

  // the HTML Element (for example, an icon) that is embedded inside the text field (right side)
  suffix?: string | JSX.Element | HTMLElement | undefined;

  // Function that handles change in input
  changeHandler?: Function;

  // Event Listener for value change in input
  onChange?: EventListener | any;

  // Value to be shown in the TextField
  value?: string | null | undefined;
}

/**
 * Create a customizable Material UI TextField
 *
 * @param {TextFieldProps} props the properties passed to the TextField component
 * @returns {JSX.Element} the created TextField element
 */
export function TextField(props: TextFieldProps): JSX.Element {
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
