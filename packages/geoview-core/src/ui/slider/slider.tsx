/* eslint-disable react/require-default-props */
import { useState, useEffect, useCallback, CSSProperties, useLayoutEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import { Slider as MaterialSlider, SliderProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from './slider-style';

/**
 * Properties for the Slider
 */
interface TypeSliderProps extends SliderProps {
  sliderId: string;

  // custom slider classes and styles
  className?: string;
  style?: CSSProperties;

  // default values (min, max, range)
  min: number;
  max: number;
  value: Array<number> | number;

  // custom onChange callback
  customOnChange?: (value: number[] | number) => void;

  // callback when slider value changes
  // TODO: Refactor - Probably good to see what's the intended difference vs customOnChange (which btw should be renamed to onCustomChanged)
  onSliderValueChanged?: (value: SliderTypeEvent) => void;

  // MUI optional props
  disabled?: boolean;
  marks?: Array<{ label?: string; value: number }>;
  orientation?: 'vertical' | 'horizontal' | undefined;
  step?: number | null;
  size?: 'small' | 'medium';
  track?: 'inverted' | 'normal' | false;
  ariaLabelledby?: string;

  // optional map id to link the slider to
  mapId?: string;
}

/**
 * Create a customized Material UI Slider (https://mui.com/material-ui/api/slider/)
 *
 * @param {TypeSliderProps} props the properties passed to the slider element
 * @returns {JSX.Element} the created Slider element
 */
export function Slider(props: TypeSliderProps): JSX.Element {
  const { value: parentValue, min, max, customOnChange, onSliderValueChanged, ...properties } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const containerId = `${properties.mapId}-${properties.sliderId}` || '';

  // internal state
  const [value, setValue] = useState<number[] | number>(parentValue);
  const [activeThumb, setActiveThumb] = useState<number>(-1);

  // Raises the value changed events
  const onValueChanged = useCallback(
    (newValue: number | number[]) => {
      // Log
      logger.logTraceUseCallback('UI.SLIDER', min, max, newValue, activeThumb);

      // run the custon onChange function
      customOnChange?.(newValue);

      // create the payload
      const sliderValues: SliderTypeEvent = {
        min,
        max,
        value: newValue,
        activeThumb,
      };

      // Callback
      onSliderValueChanged?.(sliderValues);
    },
    [min, max, activeThumb, customOnChange, onSliderValueChanged]
  );

  // handle constant change on the slider to set active thumb and instant values
  const handleChange = (event: React.SyntheticEvent | Event, newValue: number | number[], newActiveThumb: number) => {
    setActiveThumb(newActiveThumb);
    setValue(newValue);
  };

  // handle the commit change event when mouseup is fired
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    setValue(newValue);

    // Raise about the change
    onValueChanged(newValue);
  };

  const checkOverlap = (prev: Element | null, curr: Element, next: Element | null, orientation: string | undefined = 'horizontal') => {
    const labelPadding = 10;
    const prevDim = prev ? prev.getBoundingClientRect() : null;
    const currDim = curr.getBoundingClientRect();
    const nextDim = next ? next.getBoundingClientRect() : null;

    let hasPrevOverlap = false;
    let hasNextOverlap = false;

    if (prevDim) {
      hasPrevOverlap =
        orientation === 'vertical' ? prevDim.bottom + labelPadding > currDim.top : prevDim.right + labelPadding > currDim.left;
    }
    if (nextDim) {
      hasNextOverlap =
        orientation === 'vertical' ? currDim.bottom + labelPadding > nextDim.top : currDim.right + labelPadding > nextDim.left;
    }

    return hasPrevOverlap || hasNextOverlap;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removeLabelOverlap = () => {
    // Log
    logger.logTraceCore('UI.SLIDER - removeLabelOverlap');

    // get slider labels
    const markers = containerId
      ? document.getElementById(containerId)?.getElementsByClassName('MuiSlider-markLabel') || []
      : document.getElementsByClassName('MuiSlider-markLabel');

    for (let i = 0; i < markers.length; i++) markers[i].classList.remove('MuiSlider-markLabel-overlap');

    let middleIndices = markers.length % 2 === 0 ? [markers.length / 2, markers.length / 2 + 1] : [Math.floor(markers.length / 2)];
    let lastVisibleInFirstHalf = 0;
    let firstVisibleInSecondHalf = markers.length - 1;

    // Check first half
    for (let prevIdx = 0, currIdx = 1; currIdx < markers.length / 2; currIdx++) {
      // if there is a collision, set classname and test with the next pips
      if (checkOverlap(markers[prevIdx], markers[currIdx], null)) {
        markers[currIdx].classList.add('MuiSlider-markLabel-overlap');
      } else {
        // if there is no collision and reset the startIdx to be the one before the fwdIdx
        prevIdx = currIdx - prevIdx !== 1 ? currIdx : prevIdx + 1;
        lastVisibleInFirstHalf = currIdx;
      }
    }

    // Check second half
    for (let nextIdx = markers.length - 1, currIdx = markers.length - 2; currIdx > markers.length / 2; currIdx--) {
      if (checkOverlap(null, markers[currIdx], markers[nextIdx])) {
        markers[currIdx].classList.add('MuiSlider-markLabel-overlap');
      } else {
        // if there is no  collision and reset the curIndex to be the one before the testIndex
        nextIdx = nextIdx - currIdx !== 1 ? currIdx : nextIdx - 1;
        firstVisibleInSecondHalf = currIdx;
      }
    }

    middleIndices.push(lastVisibleInFirstHalf, firstVisibleInSecondHalf);
    middleIndices = [...new Set(middleIndices)].sort((a, b) => a - b);

    // Check middle elements
    for (let testIdx = 0, currIdx = 1; currIdx < middleIndices.length; currIdx++) {
      if (
        checkOverlap(
          markers[middleIndices[testIdx]],
          markers[middleIndices[currIdx]],
          currIdx === middleIndices.length - 1 ? null : markers[middleIndices[currIdx + 1]]
        )
      ) {
        markers[middleIndices[currIdx]].classList.add('MuiSlider-markLabel-overlap');
      } else {
        testIdx = currIdx - testIdx !== 1 ? currIdx : testIdx + 1;
      }
    }
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.SLIDER - parent value', parentValue);

    // Update it internally when the parent has updated the value
    setValue(parentValue);

    // Raise about the change
    onValueChanged(parentValue);
  }, [onValueChanged, parentValue]);

  useLayoutEffect(() => {
    // remove overlaping labels
    removeLabelOverlap();

    window.addEventListener('resize', () => removeLabelOverlap);
    return () => window.removeEventListener('resize', () => removeLabelOverlap);
  }, [removeLabelOverlap]);

  // TODO: better implement WCAG on slider
  return (
    <MaterialSlider
      id={containerId}
      sx={{ ...(!properties.className ? sxClasses.slider : {}) }}
      className={properties.className !== undefined ? properties.className : ''}
      style={properties.style}
      getAriaLabel={() => 'To implement with translation'}
      getAriaValueText={() => 'To implement with translation'}
      aria-labelledby={properties.ariaLabelledby}
      value={value}
      min={min}
      max={max}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      disabled={properties.disabled}
      marks={properties.marks}
      track={properties.track}
      orientation={properties.orientation}
      step={properties.step}
      size={properties.size}
      disableSwap={false}
      valueLabelDisplay="auto"
      valueLabelFormat={properties.valueLabelFormat}
    />
  );
}

/**
 * Define an event for the callback
 */
export type SliderTypeEvent = {
  // limits (min max)
  min: number;
  max: number;

  // value(s)
  value: number[] | number;

  // active thumb
  activeThumb: number;
};
