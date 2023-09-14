/* eslint-disable react/require-default-props */
import { useState } from 'react';
import { Slider as MaterialSlider, SliderProps } from '@mui/material';

/**
 * Properties for the Slider
 */
interface TypeSliderProps extends SliderProps {
  // default values (min, max, range)
  min: number;
  max: number;
  value: Array<number> | number;

  // custom onChange callback
  customOnChange?: (value: number[] | number) => void;
}

/**
 * Create a customized Material UI Slider
 *
 * @param {SliderProps} props the properties passed to the Slider element
 * @returns {JSX.Element} the created Slider element
 */
export function SliderBase(props: TypeSliderProps): JSX.Element {
  const { ...properties } = props;

  const [sliderValue, setValue] = useState<number[] | number | undefined>(properties.value);
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

    // run the custon onChange function
    if (properties.customOnChange !== undefined) properties.customOnChange(newValue);
  };

  return (
    <MaterialSlider
      value={sliderValue}
      min={properties.min}
      max={properties.max}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      valueLabelDisplay="auto"
    />
  );
}
