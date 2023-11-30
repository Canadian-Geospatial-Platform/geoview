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

  // remove overlapping labels
  const removeLabelOverlap = () => {
    const labelPadding = 10;
    // get slider labels
    const markers = document.getElementsByClassName('MuiSlider-markLabel');
    for (let i = 0; i < markers.length; i++) markers[i].classList.remove('MuiSlider-markLabel-overlap');

    // loop until all labels are tested
    for (let curIndex = 0, testIndex = 1; testIndex < markers.length; testIndex++) {
      // get div rectangle and check for collision
      const d1 = markers[curIndex].getBoundingClientRect();
      const d2 = markers[testIndex].getBoundingClientRect();
      const ox = Math.abs(d1.x - d2.x) < (d1.x < d2.x ? d2.width + labelPadding : d1.width + labelPadding);
      const oy = Math.abs(d1.y - d2.y) < (d1.y < d2.y ? d2.height : d1.height);

      // if there is a collision, set classname and test with the next pips
      if (ox && oy) {
        markers[testIndex].classList.add('MuiSlider-markLabel-overlap');
      } else {
        // if there is no  collision and reset the curIndex to be the one before the testIndex
        curIndex = testIndex - curIndex !== 1 ? testIndex : curIndex + 1;
      }
    }
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

  useLayoutEffect(() => {
    // remove overlaping labels
    removeLabelOverlap();

    window.addEventListener('resize', removeLabelOverlap);
    return () => window.removeEventListener('resize', removeLabelOverlap);
  }, []);

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
