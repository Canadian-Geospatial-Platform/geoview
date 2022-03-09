import { CSSProperties, useState } from "react";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select as MaterialSelect,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

// import { styled } from '@mui/material/styles';
// import InputBase from '@mui/material/InputBase';

// const BootstrapInput = styled(InputBase)(({ theme }) => ({
//   "label + &": {
//     marginTop: theme.spacing(3),
//   },
//   "& .MuiInputBase-input": {
//     borderRadius: 4,
//     position: "relative",
//     backgroundColor: theme.palette.background.paper,
//     border: "1px solid #ced4da",
//     fontSize: 16,
//     padding: "10px 26px 10px 12px",
//     transition: theme.transitions.create(["border-color", "box-shadow"]),
//     // Use the system font instead of the default Roboto font.
//     fontFamily: [
//       "-apple-system",
//       "BlinkMacSystemFont",
//       '"Segoe UI"',
//       "Roboto",
//       '"Helvetica Neue"',
//       "Arial",
//       "sans-serif",
//       '"Apple Color Emoji"',
//       '"Segoe UI Emoji"',
//       '"Segoe UI Symbol"',
//     ].join(","),
//     "&:focus": {
//       borderRadius: 4,
//       borderColor: "#80bdff",
//       boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
//     },
//   },
// }));

const useStyles = makeStyles((theme) => ({
  formControlClass: {
    "& .MuiInputLabel-shrink": {
      color: "#80bdff",
    },
    // "&  .Mui-focused": {
    //   borderRadius: 4,
    //   boxShadow: "0 0 0 2px rgba(0,123,255,.25)",
    // },
  },
  selectClass: {
    width: 120,
  },
}));

interface TypeSelectItems {
  id?: string;
  value?: string;
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
      className={classes.formControlClass}
    >
      <InputLabel color="primary" id={id || ""}>
        {label || undefined}{" "}
      </InputLabel>
      <MaterialSelect
        className={
          className
            ? `${className} ${classes.selectClass}`
            : classes.selectClass
        }
        style={style}
        labelId={id || ""}
        id={id && id.slice(0, -1)}
        label={label || undefined}
        value={!multiple ? value : multipleValue}
        onChange={changeHandler}
        // input={<BootstrapInput />}
        multiple={multiple || false}
      >
        {selectItems &&
          selectItems.map((item: any) => (
            <MenuItem key={item.id} id={item.id} value={item.value}>
              {item.value}
            </MenuItem>
          ))}
      </MaterialSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};
