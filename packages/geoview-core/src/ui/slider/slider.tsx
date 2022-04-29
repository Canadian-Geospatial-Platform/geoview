import { useState, useEffect } from 'react';

import MaterialSlider from '@mui/material/Slider';
import makeStyles from '@mui/styles/makeStyles';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event';

import { TypeSliderProps } from '../../core/types/cgpv-types';
import { sliderPayload, payloadIsASlider, SliderTypePayload } from '../../api/events/payloads/slider-payload';

// TODO: implement styling
const useStyles = makeStyles((theme) => ({

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

  const [min, setMin] = useState(properties.min);
  const [max, setMax] = useState(properties.max);
  const [value, setValue] = useState<number[] | number>(properties.value);
  const [activeThumb, setActiveThumb] = useState<number>(-1);

  // handle constant change on the slider to set active thumb and instant values
  const handleChange = (event: React.SyntheticEvent | Event, value: number | number[], activeThumb: number) => {
    setActiveThumb(activeThumb);
    setValue(value as number[]);
  };

  // handle the commit change event when mouseup is fired
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, value: number | number[]) => {
    setValue(value as number[]);

    // run the custon onChange function
    properties.customOnChange(value);

    // create the payload
    const sliderValues: SliderTypePayload = {
      min: min,
      max: max,
      value: value,
      activeThumb: activeThumb,
    }

    // emit the slider values change event to the api
    if (properties.mapId !== undefined) {
      api.event.emit(sliderPayload(EVENT_NAMES.SLIDER.EVENT_SLIDER_CHANGE, properties.mapId, sliderValues));
    }
  };

  useEffect(() => {
    // on set min/max, update slider
    api.event.on(
      EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_MINMAX,
      (payload) => {
        if (payloadIsASlider(payload)) {
          setMin(payload.sliderValues.min);
          setMax(payload.sliderValues.max);
        }
      },
      properties.mapId
    );

    // on set values update slider
    api.event.on(
      EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_VALUES,
      (payload) => {
        if (payloadIsASlider(payload)) {
          setValue(payload.sliderValues.value);

          // run the custon onChange function
          properties.customOnChange(payload.sliderValues.value);
        }
      },
      properties.mapId
    );

    return () => {
      api.event.off(EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_MINMAX, properties.mapId);
      api.event.off(EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_VALUES, properties.mapId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO: better implement WCAG on slider
  return (
    <MaterialSlider
      className={`${properties.className !== undefined ? properties.className : ''}`}
      style={properties.style}
      getAriaLabel={() => "To implement with translation"}
      getAriaValueText={() => "To implement with translation"}
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
