import { useState, useEffect } from 'react';

import MaterialSlider from '@mui/material/Slider';
import makeStyles from '@mui/styles/makeStyles';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event';

import { TypeSliderProps } from '../../core/types/cgpv-types';
import { sliderPayload, payloadIsASlider, SliderTypePayload } from '../../api/events/payloads/slider-payload';

const useStyles = makeStyles(() => ({
  slider: {
    '& .MuiSlider-root': {
      color: '#fff',
    },
    '& .MuiSlider-thumb': {
      width: 15,
      height: 15,
      color: '#000',
      transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
      '&:before': {
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)',
      },
      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0px 0px 0px 8px ${'rgb(255 255 255 / 16%)'}`,
      },
      '&.Mui-active': {
        width: 30,
        height: 30,
      },
    },
    '& .MuiSlider-rail': {
      opacity: 0.35,
      color: 'rgba(0,0,0,0.87)',
    },
    '& .MuiSlider-track': {
      color: '#000',
    },
    '& .MuiSlider-mark': {
      height: 4,
      width: 4,
      color: '#000',
    },
    '& .MuiSlider-markLabel-overlap': {
      display: 'none',
    },
  },
}));

/**
 * Create a customized Material UI Slider (https://mui.com/material-ui/api/slider/)
 *
 * @param {TypeSliderProps} props the properties passed to the slider element
 * @returns {JSX.Element} the created Slider element
 */
export function Slider(props: TypeSliderProps): JSX.Element {
  const { ...properties } = props;

  const classes = useStyles();

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
    api.event.emit(sliderPayload(EVENT_NAMES.SLIDER.EVENT_SLIDER_CHANGE, null, sliderValues), properties.id);
  };

  // remove overlapping labels
  const removeLabelOverlap = () => {
    // get slider labels
    const markers = document.getElementsByClassName('MuiSlider-markLabel');

    // loop until all labels are tested
    for (let curIndex = 0, testIndex = 1; testIndex < markers.length; testIndex++) {
      // get div rectangle and check for collision
      const d1 = markers[curIndex].getBoundingClientRect();
      const d2 = markers[testIndex].getBoundingClientRect();
      const ox = Math.abs(d1.x - d2.x) < (d1.x < d2.x ? d2.width : d1.width);
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

  useEffect(() => {
    // remove overlaping labels
    removeLabelOverlap();

    // on set min/max, update slider
    api.event.on(
      EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_MINMAX,
      (payload) => {
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
          api.event.emit(sliderPayload(EVENT_NAMES.SLIDER.EVENT_SLIDER_CHANGE, null, sliderValues), properties.id);
        }
      },
      properties.id
    );

    // on set values update slider
    api.event.on(
      EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_VALUES,
      (payload) => {
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
          api.event.emit(sliderPayload(EVENT_NAMES.SLIDER.EVENT_SLIDER_CHANGE, null, sliderValues), properties.id);
        }
      },
      properties.id
    );

    return () => {
      api.event.off(EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_MINMAX, properties.id);
      api.event.off(EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_VALUES, properties.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, value]);

  // TODO: better implement WCAG on slider
  return (
    <MaterialSlider
      className={`${properties.className !== undefined ? properties.className : classes.slider}`}
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
    />
  );
}
