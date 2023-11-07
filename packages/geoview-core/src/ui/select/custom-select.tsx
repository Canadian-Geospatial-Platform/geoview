/* eslint-disable react/require-default-props */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, CSSProperties } from 'react';

import {
  FormControl,
  FormHelperText,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select as MaterialSelect,
  SelectChangeEvent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './custom-select-style';

/**
 * Properties for the Custom Select component
 */
interface TypeCustomSelectProps {
  labelId: string;
  className?: string;
  style?: CSSProperties;

  // the label for the select component
  label: string;

  // the menu items (<option>) for <select>
  selectItems: Array<Record<string, TypeSelectItems>> | Array<Record<string, TypeItemProps>>;

  // callback that is passed for the select component
  callBack?: <T>(params: T) => void;

  // helper text for the form
  helperText?: string;

  // if multiple selection of items is allowed
  multiple?: boolean;
}

/**
 * Required and optional properties for the items (options) of select
 */
interface TypeSelectItems {
  category?: string;
  items: Array<TypeItemProps>;
}

/**
 * Required and optional properties for the item object
 */
export interface TypeItemProps {
  itemId: string;
  value: string;
  default?: boolean;
}

/**
 * Create a customizable Material UI Select
 *
 * @param {TypeCustomSelectProps} props the properties passed to the Select component
 * @returns {JSX.Element} the created Select element
 */
export function CustomSelect(props: TypeCustomSelectProps): JSX.Element {
  const { className, style, labelId, label, selectItems, callBack, helperText, multiple, ...otherProps } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [value, setValue] = useState('');
  const [multipleValue, setMultipleValue] = useState([]);

  /**
   * Runs when a selection is changed
   *
   * @param event the selection event
   */
  const changeHandler = (event: SelectChangeEvent<string>) => {
    if (!multiple) setValue(event.target.value);
    if (multiple) {
      const {
        target: { value: targetValue },
      } = event;
      setMultipleValue((typeof targetValue === 'string' ? targetValue.split(',') : targetValue) as React.SetStateAction<never[]>);
    }
  };

  if (!multiple && typeof callBack === 'function') {
    callBack(value);
  } else if (multiple && typeof callBack === 'function') {
    callBack(multipleValue);
  }

  const isGrouped = selectItems.some((item: any) => item.category);

  const isDefault = !isGrouped
    ? selectItems.some((item: any) => item.default)
    : selectItems.some((item: any) => item.items.some((selectItem: any) => selectItem.default));

  if (isGrouped) {
    selectItems.forEach((item: any) => {
      item.items.forEach((selectItem: any) => {
        if (value) return;
        if (selectItem.default) setValue(selectItem.value);
      });
    });
  } else {
    selectItems.forEach((item: any) => {
      if (value) return;
      if (item.default) setValue(item.value);
    });
  }

  return (
    <FormControl sx={sxClasses.formControl} {...otherProps}>
      <InputLabel sx={{ ...(isDefault ? sxClasses.label : {}) }} id={labelId}>
        {label}
      </InputLabel>
      <MaterialSelect
        sx={sxClasses.select}
        className={`${className && className}`}
        style={style}
        labelId={labelId}
        id={`select-${labelId}`}
        label={label || undefined}
        value={(!multiple ? value : multipleValue) as string}
        onChange={changeHandler}
        multiple={multiple || false}
        displayEmpty
      >
        {isGrouped
          ? selectItems.map((item: any) => {
              const options: JSX.Element[] = [];
              if (item.category) options.push(<ListSubheader>{item.category ? item.category : 'Others'}</ListSubheader>);
              item.items.forEach((selectItem: any) => {
                options.push(<MenuItem value={selectItem.value}>{selectItem.value}</MenuItem>);
              });
              return options;
            })
          : selectItems.map((item: any) => (
              <MenuItem key={item.id} value={item.value}>
                {item.value}
              </MenuItem>
            ))}
      </MaterialSelect>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
