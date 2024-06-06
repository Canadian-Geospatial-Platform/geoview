import { useState, useEffect, CSSProperties, useLayoutEffect, ReactNode } from 'react';

import { useTheme } from '@mui/material/styles';
import { Slider as MaterialSlider } from '@mui/material';
import { Mark } from '@mui/base';
import { logger } from '@/core/utils/logger';

import { getSxClasses } from './slider-style';

/**
 * Properties for the Slider
 */
type SliderProps = {
  sliderId?: string;

  // Important props: min, max, value
  min: number;
  max: number;
  value: Array<number> | number;

  // custom slider classes and styles
  className?: string;
  style?: CSSProperties;

  // custom onChange callback
  onChange?: (value: number | number[], activeThumb: number) => void;
  onChangeCommitted?: (value: number | number[]) => void;
  onValueDisplay?: (value: number, index: number) => string;
  onValueDisplayAriaLabel?: (value: number, index: number) => string;

  // MUI optional props
  disabled?: boolean;
  marks?: Mark[];
  orientation?: 'vertical' | 'horizontal';
  step?: number | null;
  size?: 'small' | 'medium';
  track?: 'inverted' | 'normal' | false;
  ariaLabelledby?: string;
  valueLabelFormat?: string | ((value: number, index: number) => ReactNode);

  // optional map id to link the slider to
  // TODO: Refactor - No mapId inside a ui component in ui folder.
  mapId?: string;
};

/**
 * Create a customized Material UI Slider (https://mui.com/material-ui/api/slider/)
 *
 * @param {TypeSliderProps} props the properties passed to the slider element
 * @returns {JSX.Element} the created Slider element
 */
export function Slider(props: SliderProps): JSX.Element {
  const { value: parentValue, min, max, onChange, onChangeCommitted, onValueDisplay, onValueDisplayAriaLabel, ...properties } = props;
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const containerId = `${properties.mapId}-${properties.sliderId}` || '';

  // internal state
  const [value, setValue] = useState<number[] | number>(parentValue);
  const [activeThumb, setActiveThumb] = useState<number>(-1);

  // handle constant change on the slider to set active thumb and instant values
  const handleChange = (event: React.SyntheticEvent | Event, newValue: number | number[], newActiveThumb: number): void => {
    // Update the internal state
    setActiveThumb(newActiveThumb);
    setValue(newValue);

    // Callback
    onChange?.(newValue, activeThumb);
  };

  // handle the commit change event when mouseup is fired
  const handleChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]): void => {
    // Callback
    onChangeCommitted?.(newValue);
  };

  const checkOverlap = (
    prev: Element | null,
    curr: Element,
    next: Element | null,
    orientation: string | undefined = 'horizontal'
  ): boolean => {
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
  const removeLabelOverlap = (): void => {
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
        // if there is no collision and reset the curIndex to be the one before the testIndex
        nextIdx = nextIdx - currIdx !== 1 ? currIdx : nextIdx - 1;
        firstVisibleInSecondHalf = currIdx;
      }
    }

    middleIndices.push(lastVisibleInFirstHalf, firstVisibleInSecondHalf);
    middleIndices = [...new Set(middleIndices)].sort((a, b) => a - b);

    // If any middle elements
    if (markers.length > 2) {
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
    }
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('UI.SLIDER - parent value', parentValue);

    // Update it internally when the parent has updated the value
    setValue(parentValue);
  }, [parentValue]);

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
      aria-labelledby={properties.ariaLabelledby}
      value={value}
      min={min}
      max={max}
      disabled={properties.disabled}
      marks={properties.marks}
      track={properties.track}
      orientation={properties.orientation}
      step={properties.step}
      size={properties.size}
      disableSwap={false}
      valueLabelDisplay="auto"
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
      valueLabelFormat={onValueDisplay}
      getAriaLabel={(): string => 'To implement with translation'}
      getAriaValueText={onValueDisplayAriaLabel}
    />
  );
}
