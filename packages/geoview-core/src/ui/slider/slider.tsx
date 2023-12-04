/* eslint-disable react/require-default-props */
import { useState, useEffect, CSSProperties, useLayoutEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import { Slider as MaterialSlider, SliderProps } from '@mui/material';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { sliderPayload, payloadIsASlider, SliderTypePayload, PayloadBaseClass } from '@/api/events/payloads';
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
  const { ...properties } = props;
  properties.sliderId = properties.id!;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [min, setMin] = useState<number>(properties.min);
  const [max, setMax] = useState<number>(properties.max);
  const [value, setValue] = useState<number[] | number>(properties.value);
  const [activeThumb, setActiveThumb] = useState<number>(-1);

  // handle constant change on the slider to set active thumb and instant values
  const handleChange = (event: React.SyntheticEvent | Event, newValue: number | number[], newActiveThumb: number) => {
    setActiveThumb(newActiveThumb);
    setValue(newValue);
  };

  // handle the commit change event when mouseup is fired
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    setValue(newValue);

    // run the custon onChange function
    if (properties.customOnChange !== undefined) properties.customOnChange(newValue);

    // create the payload
    const sliderValues: SliderTypePayload = {
      min,
      max,
      value: newValue,
      activeThumb,
    };

    // emit the slider values change event to the api
    api.event.emit(sliderPayload(EVENT_NAMES.SLIDER.EVENT_SLIDER_CHANGE, properties.sliderId, sliderValues));
  };

  const sliderSetMinMaxListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsASlider(payload)) {
      setMin(payload.sliderValues.min);
      setMax(payload.sliderValues.max);

      // emit the slider values change event to the api
      const sliderValues: SliderTypePayload = {
        min: payload.sliderValues.min,
        max: payload.sliderValues.max,
        value,
        activeThumb,
      };
      api.event.emit(sliderPayload(EVENT_NAMES.SLIDER.EVENT_SLIDER_CHANGE, properties.sliderId, sliderValues));
    }
  };

  const sliderSetValuesListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsASlider(payload)) {
      setValue(payload.sliderValues.value);

      // run the custon onChange function
      if (properties.customOnChange !== undefined) properties.customOnChange(payload.sliderValues.value);

      // emit the slider values change event to the api
      const sliderValues: SliderTypePayload = {
        min,
        max,
        value: payload.sliderValues.value,
        activeThumb,
      };
      api.event.emit(sliderPayload(EVENT_NAMES.SLIDER.EVENT_SLIDER_CHANGE, properties.sliderId, sliderValues));
    }
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
    // get slider labels
    const markers = document.getElementsByClassName('MuiSlider-markLabel');
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

  useLayoutEffect(() => {
    // remove overlaping labels
    removeLabelOverlap();

    window.addEventListener('resize', removeLabelOverlap);
    return () => window.removeEventListener('resize', removeLabelOverlap);
  }, [removeLabelOverlap]);

  useEffect(() => {
    // on set min/max, update slider
    api.event.on(EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_MINMAX, sliderSetMinMaxListenerFunction, properties.id);

    // on set values update slider
    api.event.on(EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_VALUES, sliderSetValuesListenerFunction, properties.id);

    return () => {
      api.event.off(EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_MINMAX, properties.id, sliderSetMinMaxListenerFunction);
      api.event.off(EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_VALUES, properties.id, sliderSetValuesListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, value]);

  // TODO: better implement WCAG on slider
  return (
    <MaterialSlider
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
