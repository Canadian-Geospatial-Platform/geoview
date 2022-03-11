import { CSSProperties, useState } from "react";

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
  },
}));

/**
 * Properties for the TextField
 */
interface TextFieldProps extends BaseTextFieldProps {
  id: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  variant?: "outlined" | "filled" | "standard" | undefined;
  size?: "medium" | "small" | undefined;
  autoComplete?: string;
  fullWidth?: boolean;
  label: string;
  defaultValue?: string | undefined;
  required?: boolean;
  disabled?: boolean;
  type?: string | undefined;
  readonly?: boolean;
  shrink?: boolean;
  helperText?: string | undefined;
  error?: boolean;
  errorHelperText?: string | undefined;
  multiline?: boolean;
  rows?: number | undefined;
  minRows?: number | undefined;
  maxRows?: number | undefined;
  prefix?: string | JSX.Element | any;
  suffix?: string | JSX.Element | undefined;
  focused?: boolean;
  color?: string | undefined | any;
  callBack?: Function;
}

/**
 * Create a customizable Material UI TextField
 *
 * @param {TextFieldProps} props the properties passed to the TextField component
 * @returns {JSX.Element} the created TextField element
 */
export const TextField = (props: TextFieldProps): JSX.Element => {
  const [value, setValue] = useState("");

  const changeHandler = (event: any) => {
    setValue(event.target.value);
  };

  // get the props from MUI (BaseTextFieldProps)
  const {
    autoComplete,
    className,
    style,
    id,
    placeholder,
    variant,
    size,
    fullWidth,
    label,
    defaultValue,
    required,
    disabled,
    type,
    readonly,
    helperText,
    error,
    errorHelperText,
    multiline,
    rows,
    minRows,
    maxRows,
    prefix,
    suffix,
    // focused and color required?
    focused,
    color,
    callBack,
  } = props;

  typeof callBack === "function" && callBack(value);

  const classes = useStyles();

  const shrink = placeholder ? { shrink: true } : undefined;

  // {...props}

  return (
    <MaterialTextField
      className={`${classes.textField} ${className && className}`}
      style={style}
      id={id}
      value={value}
      onChange={changeHandler}
      autoComplete={autoComplete || "false"}
      variant={variant === undefined ? "outlined" : variant}
      size={size === undefined ? "medium" : size}
      fullWidth={fullWidth || false}
      label={label || undefined}
      placeholder={placeholder || ""}
      defaultValue={defaultValue || undefined}
      required={required || false}
      disabled={disabled || false}
      type={type || undefined}
      InputProps={{
        readOnly: readonly || false,
        startAdornment: prefix && (
          <InputAdornment position="start">{prefix}</InputAdornment>
        ),
        endAdornment: suffix && (
          <InputAdornment position="end">{suffix}</InputAdornment>
        ),
      }}
      InputLabelProps={shrink}
      error={error || false}
      // modify this?
      helperText={
        helperText
          ? helperText
          : helperText && error
          ? errorHelperText
          : undefined
      }
      multiline={multiline || false}
      rows={rows || undefined}
      minRows={minRows || undefined}
      maxRows={maxRows || undefined}
    />
  );
};
