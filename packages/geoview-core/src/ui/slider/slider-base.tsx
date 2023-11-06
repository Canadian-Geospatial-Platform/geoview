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
  customOnChange?: (value: number[] | number) => void;
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
  const { min, max, value: parentValue, orientation, customOnChange, onValueDisplay, onValueDisplayAriaLabel } = props;

  // internal state
  const [sliderValue, setValue] = useState<number[] | number>(parentValue);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeThumb, setActiveThumb] = useState<number>(0);

  // handle constant change on the slider to set active thumb and instant values
  const handleChange = (event: React.SyntheticEvent | Event, newValue: number | number[], newActiveThumb: number) => {
    setValue(newValue);
    setActiveThumb(newActiveThumb);
  };

  // handle the commit change event when mouseup is fired
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    setValue(newValue);

    // Callback
    // TODO: Refactor - change the name of this callback to 'onCustomChange' to follow standards
    customOnChange?.(newValue);
  };

  // Effect used to listen on the value state coming from the parent element.
  useEffect(() => {
    setValue(parentValue); // Update child's value state when the parent's value prop changes
  }, [parentValue]);

  return (
    <MaterialSlider
      value={sliderValue}
      min={min}
      max={max}
      orientation={orientation}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      valueLabelDisplay="auto"
      valueLabelFormat={onValueDisplay}
      getAriaValueText={onValueDisplayAriaLabel}
    />
  );
}
