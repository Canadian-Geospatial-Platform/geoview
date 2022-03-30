/* eslint-disable array-callback-return */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-expressions */
import React, { useState } from 'react';

import {
  FormControl,
  FormHelperText,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select as MaterialSelect,
  SelectChangeEvent,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';

import { TypeSelectProps } from '../../core/types/cgpv-types';

const useStyles = makeStyles((theme) => ({
  formControl: {
    width: '50%',
    margin: '15px 0',
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiOutlinedInput-root.Mui-focused': {
      border: `1px solid ${theme.palette.primary.contrastText}`,
    },
  },
  label: {
    position: 'absolute',
    left: 0,
    top: 0,
    transform: 'translate(14px, -9px) scale(0.75)',
    background: theme.palette.primary.light,
  },
  select: {
    width: '100%',
  },
}));

/**
 * Create a customizable Material UI Select
 *
 * @param {TypeSelectProps} props the properties passed to the Select component
 * @returns {JSX.Element} the created Select element
 */
export function Select(props: TypeSelectProps): JSX.Element {
  const classes = useStyles();
  const [value, setValue] = useState('');
  const [multipleValue, setMultipleValue] = useState([]);
  const { className, style, id, label, selectItems, callBack, helperText, multiple, ...otherProps } = props;

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
      setMultipleValue(typeof targetValue === 'string' ? targetValue.split(',') : targetValue);
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
    : selectItems.some((item: any) => item.items.some((item: any) => item.default));

  isGrouped &&
    selectItems.forEach((item: any) => {
      item.items.forEach((item: any) => {
        if (value) return;
        if (item.default) setValue(item.value);
      });
    });

  !isGrouped &&
    selectItems.forEach((item: any) => {
      if (value) return;
      if (item.default) setValue(item.value);
    });

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
        displayEmpty
      >
        {isGrouped
          ? selectItems.map((item: any) => {
              const options: JSX.Element[] = [];
              if (item.category) options.push(<ListSubheader>{item.category ? item.category : 'Others'}</ListSubheader>);
              item.items.map((item: any) => {
                options.push(<MenuItem value={item.value}>{item.value}</MenuItem>);
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
