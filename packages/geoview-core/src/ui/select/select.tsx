import { CSSProperties, useState } from "react";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select as MaterialSelect,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  formControl: {
    width: "50%",
    margin: "15px 0",
    "& .MuiInputLabel-shrink": {
      color: "#80bdff",
    },
    // "&  .Mui-focused": {
    //   borderRadius: 4,
    //   boxShadow: "0 0 0 2px rgba(0,123,255,.25)",
    // },
  },
  select: {
    width: "100%",
  },
}));

interface TypeSelectItems {
  id: string;
  value: string;
  default?: boolean;
  // disabled?: boolean;
}

/**
 * Properties for the Select
 */
interface SelectProps {
  className?: string;
  style?: CSSProperties;
  id: string;
  label: string;
  selectItems?: Array<Record<string, TypeSelectItems>> | any;
  callBack?: Function;
  variant?: "outlined" | "filled" | "standard" | undefined;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
}

/**
 * Create a customizable Material UI Select
 *
 * @param {SelectProps} props the properties passed to the Select component
 * @returns {JSX.Element} the created Select element
 */
export const Select = (props: SelectProps): JSX.Element => {
  const [value, setValue] = useState("");
  const [multipleValue, setMultipleValue] = useState([]);

  const {
    className,
    style,
    id,
    label,
    selectItems,
    callBack,
    variant,
    helperText,
    disabled,
    required,
    multiple,
  } = props;

  const changeHandler = (event: any) => {
    if (!multiple) setValue(event.target.value);

    if (multiple) {
      const {
        target: { value },
      } = event;
      setMultipleValue(typeof value === "string" ? value.split(",") : value);
    }
  };

  !multiple && typeof callBack === "function" && callBack(value);
  multiple && typeof callBack === "function" && callBack(multipleValue);

  const classes = useStyles();

  return (
    <FormControl
      variant={variant || "outlined"}
      disabled={disabled || false}
      required={required || false}
      className={classes.formControl}
    >
      <InputLabel color="primary" id={id}>
        {label}
      </InputLabel>
      <MaterialSelect
        className={`${classes.select} ${className && className}`}
        style={style}
        labelId={id}
        id={`select-${id}`}
        label={label || undefined}
        value={!multiple ? value : multipleValue}
        onChange={changeHandler}
        multiple={multiple || false}
        defaultValue={selectItems.map((item: any) =>
          item.default === true ? item.value : null
        )}
      >
        {selectItems.map((item: any) => (
          <MenuItem key={item.id} id={item.id} value={item.value}>
            {item.value}
          </MenuItem>
        ))}
      </MaterialSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};
