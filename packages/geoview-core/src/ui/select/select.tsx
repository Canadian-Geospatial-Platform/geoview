import { CSSProperties, Fragment, useState } from "react";

import {
  FormControl,
  FormHelperText,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select as MaterialSelect,
} from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";

const useStyles = makeStyles((theme) => ({
  formControl: {
    width: "50%",
    margin: "15px 0",
    "& .MuiFormLabel-root.Mui-focused": {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    "& .MuiOutlinedInput-root.Mui-focused": {
      border: `1px solid ${theme.palette.primary.contrastText}`,
    },
  },
  label: {
    position: "absolute",
    left: 0,
    top: 0,
    transform: "translate(14px, -9px) scale(0.75)",
    background: theme.palette.primary.light,
  },
  select: {
    width: "100%",
  },
}));

/**
 * Required and optional properties for the item object
 */
interface TypeItemProps {
  id: string;
  value: string;
  default?: boolean;
}

/**
 * Required and optional properties for the items (options) of select
 */
interface TypeSelectItems {
  category?: string;
  item: TypeItemProps;
}

/**
 * Properties for the Select component
 */
interface SelectProps {
  id: string;
  className?: string;
  style?: CSSProperties;

  // the label for the select component
  label: string;

  // the menu items (<option>) for <select>
  selectItems?: Array<Record<string, TypeSelectItems>> | any;

  // a placeholder that is disabled
  placeholder?: string;

  // callback that is passed for the select component
  callBack?: Function;

  // helper text for the form
  helperText?: string;

  // if multiple selection of items is allowed
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
  const [clickedDefault, setClickedDefault] = useState(false);

  const {
    className,
    style,
    id,
    label,
    placeholder,
    selectItems,
    callBack,
    helperText,
    multiple,
    ...otherProps
  } = props;

  /**
   * Runs when a selection is changed
   *
   * @param event the selection event
   */
  const changeHandler = (event: any) => {
    if (!multiple) setValue(event.target.value);

    if (multiple) {
      const {
        target: { value },
      } = event;
      setMultipleValue(typeof value === "string" ? value.split(",") : value);
    }
  };

  /**
   * Selects the default value
   *
   * @returns the default menu item
   */
  const defaultSelectJSXReturner = () => {
    const item = selectItems.filter((item: any) => item.default);
    if (item.length === 0) return;
    return (
      <MenuItem selected value={clickedDefault ? item[0].value : ""}>
        {item[0].value}
      </MenuItem>
    );
  };

  !multiple && typeof callBack === "function" && callBack(value);
  multiple && typeof callBack === "function" && callBack(multipleValue);

  // let categories: any = [];
  // selectItems.forEach((item: any) => {
  //   categories.indexOf(item.category) === -1 &&
  //     categories.push(
  //       // { category: item.category }
  //       item.category
  //     );
  // });
  // console.log(categories);

  // let categorizedSelectedItems: any = [];
  // const categorizedSelectedItems = selectItems.map((item: any) => {
  //   if (categories.includes(item.category))
  //     return {
  //       category: item.category,
  //       data: item,
  //     };
  //   // return { `${item.category}`: item };
  // });
  // console.log(categorizedSelectedItems);

  // selectItems.sort((a: any, b: any) => {
  //   if (a.category === b.category) return (a.category = b.category);
  //   else return a.category - b.category;
  // });

  // console.log(selectItems);

  const isDefault = selectItems.some((item: any) => item.default);

  const classes = useStyles();

  return (
    <FormControl className={classes.formControl} {...otherProps}>
      <InputLabel className={isDefault && classes.label} id={id}>
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
        displayEmpty={true}
        // defaultValue={"Option 3"}
        onClick={() => setClickedDefault(true)}
      >
        {placeholder ? (
          <MenuItem disabled value="">
            {placeholder}
          </MenuItem>
        ) : null}
        {defaultSelectJSXReturner()}
        {/* {selectItems.map(
          (item: any, i: any) => {
            !item.default && 
              return (<>
                <ListSubheader>{item.category}</ListSubheader>
                {item.items.map((item: any) => (
                  <MenuItem id={item.id} value={item.value}>
                    {item.value}
                  </MenuItem>
                ))}
              </>)
                })} */}
        {selectItems.map((item: any, i: any) => {
          console.log(item);
          return (
            <div key={i}>
              <ListSubheader>
                {item.category ? item.category : "Others"}
              </ListSubheader>
              {item.items.map((item: any) => {
                console.log(item);
                return (
                  <MenuItem key={item.id} value={item.value}>
                    {item.value}
                  </MenuItem>
                );
              })}
            </div>
          );
        })}
      </MaterialSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};
