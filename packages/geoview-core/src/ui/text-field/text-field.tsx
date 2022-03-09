import { CSSProperties, useState } from "react";

import { InputAdornment, TextField as MaterialTextField } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  textField: {
    width: 120,
  },
}));

/**
 * Properties for the TextField
 */
interface TextFieldProps {
  className?: string | undefined;
  style?: CSSProperties;
  id: string;
  placeholder: string;
  variant?: "outlined" | "filled" | "standard" | undefined;
  size?: "small" | "medium" | undefined;
  fullWidth?: boolean;
  label?: string;
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

  const {
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
    shrink,
    helperText,
    error,
    errorHelperText,
    multiline,
    rows,
    minRows,
    maxRows,
    prefix,
    suffix,
    focused,
    color,
    callBack,
  } = props;

  typeof callBack === "function" && callBack(value);

  const classes = useStyles();

  return (
    <MaterialTextField
      className={
        className ? `${className} ${classes.textField}` : classes.textField
      }
      style={style}
      id={id || ""}
      value={defaultValue ? undefined : value}
      onChange={changeHandler}
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
        "aria-labelledby": id,
        "aria-describedby": id,
      }}
      InputLabelProps={{
        shrink: shrink === false ? false : true,
      }}
      error={error || false}
      helperText={
        helperText && !error
          ? helperText || undefined
          : errorHelperText || undefined
      }
      multiline={multiline || false}
      rows={rows || undefined}
      minRows={minRows || undefined}
      maxRows={maxRows || undefined}
      focused={focused || false}
      color={focused && color ? color : undefined}
    />
  );
};
