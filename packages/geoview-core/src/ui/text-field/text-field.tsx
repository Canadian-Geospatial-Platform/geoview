import React, { CSSProperties, useState } from "react";

import {
  BaseTextFieldProps,
  InputAdornment,
  TextField as MaterialTextField,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  textField: {
    width: "50%",
    margin: "10px 0",
    "& .MuiFormLabel-root.Mui-focused": {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    "& .MuiOutlinedInput-root.Mui-focused": {
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

  // the helper text that goes right under the text field. It is mostly used to show warnings/errors
  helperText?: string | JSX.Element | HTMLElement | undefined;

  // if there is an error or not
  error?: boolean;

  // the helper text (as defined above) but only if there is an error
  errorHelpertext?: string | undefined;

  // the HTML Element (for example, an icon) that is embedded inside the text field (left side)
  prefix?: string | JSX.Element | HTMLElement | any;

  // the HTML Element (for example, an icon) that is embedded inside the text field (right side)
  suffix?: string | JSX.Element | HTMLElement | undefined;

  // callback function for this component
  callBack?: Function;

  // ref for this component
  inputRef?: React.RefObject<any> | null | undefined;
}

/**
 * Create a customizable Material UI TextField
 *
 * @param {TextFieldProps} props the properties passed to the TextField component
 * @returns {JSX.Element} the created TextField element
 */
export const TextField = (props: TextFieldProps): JSX.Element => {
  const [value, setValue] = useState("");
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
    callBack,
    ...otherProps
  } = props;

  /**
   * Handles the change that is made to the text field
   *
   * @param event the text input event
   */
  const changeHandler = (event: any) => {
    setValue(event.target.value);
  };

  typeof callBack === "function" && callBack(value);

  return (
    <MaterialTextField
      className={`${classes.textField} ${className && className}`}
      style={style}
      value={defaultValue ? undefined : value}
      onChange={changeHandler}
      inputRef={inputRef ? inputRef : undefined}
      InputProps={{
        startAdornment: prefix && (
          <InputAdornment position="start">{prefix}</InputAdornment>
        ),
        endAdornment: suffix && (
          <InputAdornment position="end">{suffix}</InputAdornment>
        ),
      }}
      helperText={
        helperText && !error
          ? helperText || undefined
          : (error && errorHelpertext) || undefined
      }
      {...otherProps}
    />
  );
};
