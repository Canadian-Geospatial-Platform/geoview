/* eslint-disable react/require-default-props */
import { useState, useEffect } from 'react';

import { Slider as MaterialSlider, SliderProps } from '@mui/material';

/**
 * Properties for the Slider
 */
interface TypeSliderProps extends SliderProps {
  // default values (min, max, range)
  min: number;
  max: number;
  value: number | number[];

  // custom onChange callback
  onValueDisplay?: (value: number, index: number) => string;
  onValueDisplayAriaLabel?: (value: number, index: number) => string;
}

/**
 * Create a customized Material UI Slider
 *
 * @param {SliderProps} props the properties passed to the Slider element
 * @returns {JSX.Element} the created Slider element
 */
export function SliderBase(props: TypeSliderProps): JSX.Element {
  const {
    min,
    max,
    step,
    value: parentValue,
    orientation,
    onChange,
    onValueDisplay,
    onValueDisplayAriaLabel,
    marks,
    disableSwap,
    track,
  } = props;

  // internal state
  const [sliderValue, setValue] = useState<number[] | number>(parentValue);

  // Effect used to listen on the value state coming from the parent element.
  useEffect(() => {
    setValue(parentValue); // Update child's value state when the parent's value prop changes
  }, [parentValue]);

  return (
    <MaterialSlider
      value={sliderValue}
      min={min}
      max={max}
      marks={marks}
      orientation={orientation}
      step={step}
      onChange={onChange}
      valueLabelDisplay="auto"
      valueLabelFormat={onValueDisplay}
      getAriaValueText={onValueDisplayAriaLabel}
      disableSwap={disableSwap}
      track={track}
    />
  );
}
