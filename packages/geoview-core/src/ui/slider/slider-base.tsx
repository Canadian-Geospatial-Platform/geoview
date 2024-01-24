/* eslint-disable react/require-default-props */
import { useState, useEffect, SyntheticEvent } from 'react';

import { Slider as MaterialSlider, SliderProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Slider
 */
interface TypeSliderProps extends SliderProps {
  // default values (min, max, range)
  min: number;
  max: number;
  value: number | number[];

  // custom onChange callback
  onChange?: (event: Event, value: number | number[], activeThumb: number) => void;
  onChangeCommitted?: (event: Event | SyntheticEvent<Element, Event>, value: number | number[]) => void;
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
    onChangeCommitted,
    onValueDisplay,
    onValueDisplayAriaLabel,
    marks,
    disableSwap,
    track,
  } = props;

  // internal state
  const [sliderValue, setValue] = useState<number[] | number>(parentValue);

  /**
   * Handles the change event of the MaterialSlider
   * @param event Event The event
   * @param value number | number[] The value(s)
   * @param activeThumb number
   */
  const handleChange = (event: Event, value: number | number[], activeThumb: number): void => {
    // Set the value when user is sliding the anchor
    setValue(value);

    // Callback on regular component callback
    onChange?.(event, value, activeThumb);
  };

  // Effect used to listen on the value state coming from the parent element.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('SLIDER-BASE - parentValue', parentValue);

    // Update child's value state when the parent's value prop changes
    setValue(parentValue);
  }, [parentValue]);

  return (
    <MaterialSlider
      value={sliderValue}
      min={min}
      max={max}
      marks={marks}
      orientation={orientation}
      step={step}
      onChange={(event: Event, value: number | number[], activeThumb: number) => handleChange(event, value, activeThumb)}
      onChangeCommitted={onChangeCommitted}
      valueLabelDisplay="auto"
      valueLabelFormat={onValueDisplay}
      getAriaValueText={onValueDisplayAriaLabel}
      disableSwap={disableSwap}
      track={track}
    />
  );
}
